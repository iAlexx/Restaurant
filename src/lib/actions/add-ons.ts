"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { addOnSchema } from "@/lib/validations/menu";
import type { AddOn } from "@/types/database";
import type { ActionResult } from "@/lib/actions/types";
import { parseToggleForm } from "@/lib/actions/toggle-form";
import {
  buildAddOnDeletePreview,
  type DeletePreview,
} from "@/lib/admin/delete-policy";
import { parseEntityId } from "@/lib/admin/delete-id";

export async function listAddOns(): Promise<AddOn[]> {
  await requireAdminSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("add_ons")
    .select("*")
    .order("name_ar", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as AddOn[];
}

export async function createAddOn(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminSession();
  const parsed = addOnSchema.safeParse({
    name_ar: formData.get("name_ar"),
    extra_price: formData.get("extra_price") ?? 0,
    is_available:
      formData.get("is_available") === "on" ||
      formData.get("is_available") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("add_ons").insert(parsed.data);

  if (error) return { error: "تعذر إنشاء الإضافة" };

  revalidatePath("/dashboard/add-ons");
  revalidatePath("/dashboard/products");
  return { success: "تم إنشاء الإضافة" };
}

export async function updateAddOn(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminSession();
  const parsed = addOnSchema.safeParse({
    name_ar: formData.get("name_ar"),
    extra_price: formData.get("extra_price") ?? 0,
    is_available:
      formData.get("is_available") === "on" ||
      formData.get("is_available") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("add_ons")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: "تعذر تحديث الإضافة" };

  revalidatePath("/dashboard/add-ons");
  revalidatePath("/dashboard/products");
  return { success: "تم تحديث الإضافة" };
}

export async function toggleAddOnAvailable(
  id: string,
  isAvailable: boolean
): Promise<ActionResult> {
  await requireAdminSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("add_ons")
    .update({ is_available: isAvailable })
    .eq("id", id);

  if (error) return { error: "تعذر تحديث حالة الإضافة" };

  revalidatePath("/dashboard/add-ons");
  return { success: isAvailable ? "تم تفعيل الإضافة" : "تم إيقاف الإضافة" };
}

export async function toggleAddOnAvailableForm(
  formData: FormData
): Promise<void> {
  const values = parseToggleForm(formData);
  if (!values) return;
  await toggleAddOnAvailable(values.id, values.next);
}

export async function getAddOnDeletePreview(id: string): Promise<DeletePreview> {
  await requireAdminSession();
  const entityId = parseEntityId(id);
  if (!entityId) {
    return {
      canDelete: false,
      entityName: "",
      blockReason: "معرّف الإضافة غير صالح",
      dependencyLines: [],
      requireTypedConfirmation: false,
    };
  }

  const supabase = await createClient();
  const { data: addOn, error } = await supabase
    .from("add_ons")
    .select("name_ar")
    .eq("id", entityId)
    .maybeSingle();

  if (error || !addOn) {
    return {
      canDelete: false,
      entityName: "",
      blockReason: "الإضافة غير موجودة",
      dependencyLines: [],
      requireTypedConfirmation: false,
    };
  }

  const { count: productLinkCount, error: linkError } = await supabase
    .from("product_add_ons")
    .select("product_id", { count: "exact", head: true })
    .eq("add_on_id", entityId);

  const { count: orderItemAddOnCount, error: orderError } = await supabase
    .from("order_item_add_ons")
    .select("id", { count: "exact", head: true })
    .eq("add_on_id", entityId);

  if (linkError || orderError) {
    return {
      canDelete: false,
      entityName: (addOn as { name_ar: string }).name_ar,
      blockReason: "تعذر التحقق من ارتباطات الإضافة",
      dependencyLines: [],
      requireTypedConfirmation: false,
    };
  }

  return buildAddOnDeletePreview(
    (addOn as { name_ar: string }).name_ar,
    productLinkCount ?? 0,
    orderItemAddOnCount ?? 0
  );
}

export async function deleteAddOn(id: string): Promise<ActionResult> {
  await requireAdminSession();
  const entityId = parseEntityId(id);
  if (!entityId) return { error: "معرّف الإضافة غير صالح" };

  const preview = await getAddOnDeletePreview(entityId);
  if (!preview.canDelete) {
    return { error: preview.blockReason ?? "لا يمكن حذف هذه الإضافة" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("add_ons").delete().eq("id", entityId);

  if (error) {
    if (error.code === "23503") {
      return {
        error: "لا يمكن حذف الإضافة لأنها مرتبطة بمنتجات حالياً",
      };
    }
    return { error: "تعذر حذف الإضافة" };
  }

  revalidatePath("/dashboard/add-ons");
  revalidatePath("/dashboard/products");
  return { success: "تم حذف الإضافة" };
}
