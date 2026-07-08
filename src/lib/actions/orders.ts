"use server";

import { revalidatePath } from "next/cache";
import { requireStaffSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  filterOrdersByListFilter,
  pickLatestPrintStatus,
} from "@/lib/orders/dashboard";
import type { OrderListRow } from "@/lib/orders/dashboard";
import {
  invokeCreateCustomerOrderRpc,
  rpcResultToCreateOrderResult,
} from "@/lib/orders/create-order";
import { validateAndBuildManualPayload } from "@/lib/orders/validate-manual-order";
import { OrderValidationError } from "@/lib/orders/validate-order";
import {
  canCancelOrder,
  isValidStatusTransition,
} from "@/lib/orders/status-transitions";
import type { ActionResult } from "@/lib/actions/types";
import {
  cancelOrderSchema,
  orderListFilterSchema,
  reprintOrderSchema,
  updateOrderStatusSchema,
  type OrderListFilter,
} from "@/lib/validations/order-status";
import { manualOrderSchema } from "@/lib/validations/manual-order";
import type {
  Order,
  OrderItem,
  OrderItemAddOn,
  PrintJob,
} from "@/types/database";

export async function listOrdersForStaff(
  filter: OrderListFilter = "all"
): Promise<OrderListRow[]> {
  await requireStaffSession();
  const parsedFilter = orderListFilterSchema.parse(filter);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, order_type, status, table_label_snapshot, customer_name, customer_phone, total, created_at, print_jobs(status, created_at)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error("تعذر تحميل الطلبات");
  }

  const rows = (data ?? []).map((row) => {
    const order = row as OrderListRow & {
      print_jobs?: { status: PrintJob["status"]; created_at: string }[];
    };
    return {
      id: order.id,
      order_number: order.order_number,
      order_type: order.order_type,
      status: order.status,
      table_label_snapshot: order.table_label_snapshot,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      total: order.total,
      created_at: order.created_at,
      latest_print_status: pickLatestPrintStatus(order.print_jobs ?? []),
    };
  });

  return filterOrdersByListFilter(rows, parsedFilter);
}

export async function getOrderDetailForStaff(orderId: string) {
  await requireStaffSession();
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return null;
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("id", { ascending: true });

  const itemIds = ((items ?? []) as OrderItem[]).map((i) => i.id);

  const { data: addOns } = itemIds.length
    ? await supabase
        .from("order_item_add_ons")
        .select("*")
        .in("order_item_id", itemIds)
    : { data: [] };

  const { data: printJobs } = await supabase
    .from("print_jobs")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  const { data: settings } = await supabase
    .from("restaurant_settings")
    .select("currency_label")
    .eq("id", 1)
    .single();

  return {
    order: order as Order,
    items: (items ?? []) as OrderItem[],
    addOns: (addOns ?? []) as OrderItemAddOn[],
    printJobs: (printJobs ?? []) as PrintJob[],
    currency_label: (settings as { currency_label: string } | null)?.currency_label ?? "ل.س",
  };
}

export async function updateOrderStatusAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireStaffSession();

  const parsed = updateOrderStatusSchema.safeParse({
    order_id: formData.get("order_id"),
    expected_status: formData.get("expected_status"),
    new_status: formData.get("new_status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }

  const { order_id, expected_status, new_status } = parsed.data;

  if (!isValidStatusTransition(expected_status, new_status)) {
    return { error: "انتقال الحالة غير مسموح" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .update({ status: new_status })
    .eq("id", order_id)
    .eq("status", expected_status)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: "تعذر تحديث حالة الطلب" };
  }

  if (!data) {
    return { error: "تغيّرت حالة الطلب. حدّث الصفحة وحاول مرة أخرى." };
  }

  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${order_id}`);
  return { success: "تم تحديث حالة الطلب" };
}

export async function cancelOrderAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireStaffSession();

  const parsed = cancelOrderSchema.safeParse({
    order_id: formData.get("order_id"),
    expected_status: formData.get("expected_status"),
    cancellation_reason: formData.get("cancellation_reason"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }

  const { order_id, expected_status, cancellation_reason } = parsed.data;

  if (!canCancelOrder(expected_status)) {
    return { error: "لا يمكن إلغاء هذا الطلب" };
  }

  if (!isValidStatusTransition(expected_status, "CANCELLED")) {
    return { error: "انتقال الإلغاء غير مسموح" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "CANCELLED",
      cancellation_reason,
    })
    .eq("id", order_id)
    .eq("status", expected_status)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: "تعذر إلغاء الطلب" };
  }

  if (!data) {
    return { error: "تغيّرت حالة الطلب. حدّث الصفحة وحاول مرة أخرى." };
  }

  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${order_id}`);
  return { success: "تم إلغاء الطلب" };
}

export async function reprintOrderAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireStaffSession();

  const parsed = reprintOrderSchema.safeParse({
    order_id: formData.get("order_id"),
  });

  if (!parsed.success) {
    return { error: "معرف الطلب غير صالح" };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("create_reprint_job", {
    p_order_id: parsed.data.order_id,
  });

  if (error || !data) {
    return { error: "تعذر إنشاء طلب إعادة طباعة" };
  }

  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${parsed.data.order_id}`);
  return { success: "تم إنشاء طلب إعادة طباعة" };
}

export async function createManualOrderAction(
  _prev: ActionResult & { orderId?: string },
  formData: FormData
): Promise<ActionResult & { orderId?: string }> {
  const session = await requireStaffSession();

  const orderType = formData.get("order_type");
  const itemsRaw = formData.get("items_json");

  let items: unknown;
  try {
    items = itemsRaw ? JSON.parse(String(itemsRaw)) : [];
  } catch {
    return { error: "بيانات المنتجات غير صالحة" };
  }

  const base = {
    submit_token: formData.get("submit_token"),
    order_type: orderType,
    items,
    notes: formData.get("notes") || null,
  };

  let input;
  if (orderType === "DINE_IN") {
    input = {
      ...base,
      table_id: formData.get("table_id"),
    };
  } else if (orderType === "DELIVERY") {
    input = {
      ...base,
      customer_name: formData.get("customer_name"),
      customer_phone: formData.get("customer_phone"),
      customer_address: formData.get("customer_address"),
      location_url: formData.get("location_url") || null,
      delivery_fee: formData.get("delivery_fee"),
    };
  } else {
    input = {
      ...base,
      customer_name: formData.get("customer_name"),
      customer_phone: formData.get("customer_phone"),
      pickup_time: formData.get("pickup_time") || null,
    };
  }

  const parsed = manualOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }

  try {
    const supabase = createServiceClient();
    const { currency_label, trustedPayload } =
      await validateAndBuildManualPayload(
        supabase,
        parsed.data,
        session.userId
      );

    const rpcResult = await invokeCreateCustomerOrderRpc(
      supabase,
      trustedPayload
    );

    const result = rpcResultToCreateOrderResult(rpcResult, currency_label);

    revalidatePath("/dashboard/orders");

    return {
      success: result.existing
        ? "الطلب موجود مسبقاً"
        : "تم إنشاء الطلب بنجاح",
      orderId: result.id,
    };
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return { error: error.message };
    }
    return { error: "تعذر إنشاء الطلب" };
  }
}

export async function listActiveTablesForManualOrder() {
  await requireStaffSession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tables")
    .select("id, label")
    .eq("is_active", true)
    .order("label", { ascending: true });

  if (error) return [];
  return (data ?? []) as { id: string; label: string }[];
}
