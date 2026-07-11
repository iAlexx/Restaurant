"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";
import type { RestaurantCharge } from "@/lib/charges/types";
import {
  chargeInputToDbValues,
  chargeSchema,
} from "@/lib/validations/charges";
import { parseEntityId } from "@/lib/admin/delete-id";
import { parseToggleForm } from "@/lib/actions/toggle-form";

export type { ActionResult } from "@/lib/actions/types";

function parseChargeForm(formData: FormData) {
  const calculationType = formData.get("calculation_type");
  return chargeSchema.safeParse({
    name_ar: formData.get("name_ar"),
    calculation_type: calculationType,
    percentage_input:
      calculationType === "PERCENTAGE"
        ? formData.get("percentage_input")
        : undefined,
    fixed_amount:
      calculationType === "FIXED" ? formData.get("fixed_amount") : undefined,
    applies_to: formData.get("applies_to") ?? "ALL",
    sort_order: formData.get("sort_order") ?? 0,
    is_active:
      formData.get("is_active") === "on" ||
      formData.get("is_active") === "true",
  });
}

export async function listChargesForAdmin(): Promise<RestaurantCharge[]> {
  await requireAdminSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurant_charges")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as RestaurantCharge[];
}

export async function createCharge(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminSession();
  const parsed = parseChargeForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurant_charges")
    .insert(chargeInputToDbValues(parsed.data));

  if (error) return { error: "تعذر إنشاء الرسم" };

  revalidatePath("/dashboard/charges");
  return { success: "تم إنشاء الرسم" };
}

export async function updateCharge(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminSession();
  const idRaw = formData.get("id");
  const id = typeof idRaw === "string" ? parseEntityId(idRaw) : null;
  if (!id) return { error: "معرّف غير صالح" };

  const parsed = parseChargeForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurant_charges")
    .update({
      ...chargeInputToDbValues(parsed.data),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: "تعذر تحديث الرسم" };

  revalidatePath("/dashboard/charges");
  return { success: "تم تحديث الرسم" };
}

export async function toggleChargeActive(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminSession();
  const parsed = parseToggleForm(formData);
  if (!parsed) return { error: "بيانات غير صالحة" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurant_charges")
    .update({ is_active: parsed.next, updated_at: new Date().toISOString() })
    .eq("id", parsed.id);

  if (error) return { error: "تعذر تحديث الحالة" };

  revalidatePath("/dashboard/charges");
  return { success: parsed.next ? "تم تفعيل الرسم" : "تم إيقاف الرسم" };
}

export async function deleteCharge(id: string): Promise<ActionResult> {
  await requireAdminSession();
  const chargeId = parseEntityId(id);
  if (!chargeId) return { error: "معرّف غير صالح" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurant_charges")
    .delete()
    .eq("id", chargeId);

  if (error) return { error: "تعذر حذف الرسم" };

  revalidatePath("/dashboard/charges");
  return { success: "تم حذف الرسم. الطلبات السابقة تحتفظ بلقطاتها." };
}
