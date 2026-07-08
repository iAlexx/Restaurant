import type { SupabaseClient } from "@supabase/supabase-js";
import { ORDER_TYPE_LABELS } from "@/lib/orders/status-transitions";
import {
  receiptPayloadSchema,
  type ReceiptPayload,
} from "@/lib/print-agent/types";

interface DbOrder {
  id: string;
  order_number: string;
  order_type: ReceiptPayload["order_type"];
  table_label_snapshot: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  location_url: string | null;
  pickup_time: string | null;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
}

interface DbOrderItem {
  id: string;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  line_total: number;
  notes: string | null;
}

interface DbAddOn {
  order_item_id: string;
  name_snapshot: string;
  price_snapshot: number;
}

interface DbSettings {
  name: string;
  receipt_header: string | null;
  receipt_footer: string | null;
  currency_label: string;
}

export async function buildReceiptPayloadFromSnapshots(
  supabase: SupabaseClient,
  params: {
    jobId: string;
    orderId: string;
    isReprint: boolean;
  }
): Promise<ReceiptPayload> {
  const { jobId, orderId, isReprint } = params;

  const [orderRes, itemsRes, settingsRes] = await Promise.all([
    supabase.from("orders").select("*").eq("id", orderId).single(),
    supabase
      .from("order_items")
      .select("id, product_name_snapshot, unit_price_snapshot, quantity, line_total, notes")
      .eq("order_id", orderId)
      .order("id", { ascending: true }),
    supabase
      .from("restaurant_settings")
      .select("name, receipt_header, receipt_footer, currency_label")
      .eq("id", 1)
      .single(),
  ]);

  if (orderRes.error || !orderRes.data) {
    throw new Error("الطلب غير موجود");
  }
  if (settingsRes.error || !settingsRes.data) {
    throw new Error("تعذر تحميل إعدادات المطعم");
  }

  const order = orderRes.data as DbOrder;
  const items = (itemsRes.data ?? []) as DbOrderItem[];
  const settings = settingsRes.data as DbSettings;

  const itemIds = items.map((item) => item.id);
  const { data: addOnRows } = itemIds.length
    ? await supabase
        .from("order_item_add_ons")
        .select("order_item_id, name_snapshot, price_snapshot")
        .in("order_item_id", itemIds)
    : { data: [] };

  const addOnsByItem = new Map<string, DbAddOn[]>();
  for (const row of (addOnRows ?? []) as DbAddOn[]) {
    const list = addOnsByItem.get(row.order_item_id) ?? [];
    list.push(row);
    addOnsByItem.set(row.order_item_id, list);
  }

  const payload: ReceiptPayload = {
    job_id: jobId,
    is_reprint: isReprint,
    restaurant_name: settings.name,
    receipt_header: settings.receipt_header,
    receipt_footer: settings.receipt_footer,
    currency_label: settings.currency_label,
    order_number: order.order_number,
    order_type: order.order_type,
    order_type_label: ORDER_TYPE_LABELS[order.order_type],
    table_label: order.table_label_snapshot,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    customer_address: order.customer_address,
    location_url: order.location_url,
    pickup_time: order.pickup_time,
    notes: order.notes,
    items: items.map((item) => ({
      name: item.product_name_snapshot,
      quantity: item.quantity,
      unit_price: item.unit_price_snapshot,
      line_total: item.line_total,
      notes: item.notes,
      add_ons: (addOnsByItem.get(item.id) ?? []).map((addOn) => ({
        name: addOn.name_snapshot,
        price: addOn.price_snapshot,
      })),
    })),
    subtotal: order.subtotal,
    delivery_fee: order.delivery_fee,
    total: order.total,
    created_at: order.created_at,
  };

  return receiptPayloadSchema.parse(payload);
}
