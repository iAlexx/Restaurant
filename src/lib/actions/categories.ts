"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validations/menu";
import type { Category } from "@/types/database";

import type { ActionResult } from "@/lib/actions/types";
import { parseToggleForm } from "@/lib/actions/toggle-form";

export type { ActionResult } from "@/lib/actions/types";

export async function listCategories(): Promise<Category[]> {
  await requireAdminSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

export async function createCategory(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminSession();
  const parsed = categorySchema.safeParse({
    name_ar: formData.get("name_ar"),
    sort_order: formData.get("sort_order") || 0,
    is_active: formData.get("is_active") === "on" || formData.get("is_active") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert(parsed.data);

  if (error) return { error: "تعذر إنشاء القسم" };

  revalidatePath("/dashboard/categories");
  return { success: "تم إنشاء القسم" };
}

export async function updateCategory(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminSession();
  const parsed = categorySchema.safeParse({
    name_ar: formData.get("name_ar"),
    sort_order: formData.get("sort_order") || 0,
    is_active: formData.get("is_active") === "on" || formData.get("is_active") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: "تعذر تحديث القسم" };

  revalidatePath("/dashboard/categories");
  return { success: "تم تحديث القسم" };
}

export async function toggleCategoryActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  await requireAdminSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { error: "تعذر تحديث حالة القسم" };

  revalidatePath("/dashboard/categories");
  return { success: isActive ? "تم تفعيل القسم" : "تم إيقاف القسم" };
}

export async function toggleCategoryActiveForm(
  formData: FormData
): Promise<void> {
  const values = parseToggleForm(formData);
  if (!values) return;
  await toggleCategoryActive(values.id, values.next);
}
