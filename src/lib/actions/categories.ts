"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validations/menu";
import { safeDeleteReplacedMenuImage } from "@/lib/storage/menu-bucket";
import type { Category } from "@/types/database";
import {
  buildCategoryDeletePreview,
  type DeletePreview,
} from "@/lib/admin/delete-policy";
import { parseEntityId } from "@/lib/admin/delete-id";

import type { ActionResult } from "@/lib/actions/types";
import { parseToggleForm } from "@/lib/actions/toggle-form";

export type { ActionResult } from "@/lib/actions/types";

function parseCategoryForm(formData: FormData) {
  return categorySchema.safeParse({
    name_ar: formData.get("name_ar"),
    image_url: formData.get("image_url") ?? "",
    sort_order: formData.get("sort_order") || 0,
    is_active: formData.get("is_active") === "on" || formData.get("is_active") === "true",
  });
}

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
  const parsed = parseCategoryForm(formData);

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
  const parsed = parseCategoryForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("categories")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchError) return { error: "تعذر تحديث القسم" };

  const previousImageUrl = (existing as { image_url: string | null }).image_url;
  await safeDeleteReplacedMenuImage(previousImageUrl, parsed.data.image_url);

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

export async function getCategoryDeletePreview(
  id: string
): Promise<DeletePreview> {
  await requireAdminSession();
  const entityId = parseEntityId(id);
  if (!entityId) {
    return {
      canDelete: false,
      entityName: "",
      blockReason: "معرّف القسم غير صالح",
      dependencyLines: [],
      requireTypedConfirmation: false,
    };
  }

  const supabase = await createClient();
  const { data: category, error } = await supabase
    .from("categories")
    .select("name_ar")
    .eq("id", entityId)
    .maybeSingle();

  if (error || !category) {
    return {
      canDelete: false,
      entityName: "",
      blockReason: "القسم غير موجود",
      dependencyLines: [],
      requireTypedConfirmation: false,
    };
  }

  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", entityId);

  if (countError) {
    return {
      canDelete: false,
      entityName: (category as { name_ar: string }).name_ar,
      blockReason: "تعذر التحقق من منتجات القسم",
      dependencyLines: [],
      requireTypedConfirmation: false,
    };
  }

  return buildCategoryDeletePreview(
    (category as { name_ar: string }).name_ar,
    count ?? 0
  );
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdminSession();
  const entityId = parseEntityId(id);
  if (!entityId) return { error: "معرّف القسم غير صالح" };

  const preview = await getCategoryDeletePreview(entityId);
  if (!preview.canDelete) {
    return { error: preview.blockReason ?? "لا يمكن حذف هذا القسم" };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("categories")
    .select("image_url")
    .eq("id", entityId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { error: "القسم غير موجود" };
  }

  const imageUrl = (existing as { image_url: string | null }).image_url;

  const { error } = await supabase.from("categories").delete().eq("id", entityId);

  if (error) {
    if (error.code === "23503") {
      return { error: "لا يمكن حذف القسم لأنه يحتوي على منتجات" };
    }
    return { error: "تعذر حذف القسم" };
  }

  await safeDeleteReplacedMenuImage(imageUrl, null);

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/products");
  return { success: "تم حذف القسم" };
}
