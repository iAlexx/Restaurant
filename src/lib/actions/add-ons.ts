"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { addOnSchema } from "@/lib/validations/menu";
import type { AddOn } from "@/types/database";
import type { ActionResult } from "@/lib/actions/types";

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
