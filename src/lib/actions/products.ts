"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validations/menu";
import type { Product } from "@/types/database";
import type { ActionResult } from "@/lib/actions/types";

export interface ProductWithAddOns extends Product {
  add_on_ids: string[];
}

function parseAddOnIds(formData: FormData): string[] {
  const raw = formData.getAll("add_on_ids");
  return raw.map(String).filter(Boolean);
}

async function syncProductAddOns(productId: string, addOnIds: string[]) {
  const supabase = await createClient();
  await supabase.from("product_add_ons").delete().eq("product_id", productId);

  if (addOnIds.length === 0) return;

  const rows = addOnIds.map((add_on_id) => ({
    product_id: productId,
    add_on_id,
  }));

  await supabase.from("product_add_ons").insert(rows);
}

export async function listProducts(): Promise<ProductWithAddOns[]> {
  await requireAdminSession();
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  const { data: links } = await supabase
    .from("product_add_ons")
    .select("product_id, add_on_id");

  const addOnMap = new Map<string, string[]>();
  for (const link of links ?? []) {
    const row = link as { product_id: string; add_on_id: string };
    const list = addOnMap.get(row.product_id) ?? [];
    list.push(row.add_on_id);
    addOnMap.set(row.product_id, list);
  }

  return ((products ?? []) as Product[]).map((p) => ({
    ...p,
    add_on_ids: addOnMap.get(p.id) ?? [],
  }));
}

export async function createProduct(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminSession();

  const parsed = productSchema.safeParse({
    category_id: formData.get("category_id"),
    name_ar: formData.get("name_ar"),
    description_ar: formData.get("description_ar") || null,
    price: formData.get("price"),
    is_available:
      formData.get("is_available") === "on" ||
      formData.get("is_available") === "true",
    sort_order: formData.get("sort_order") || 0,
    add_on_ids: parseAddOnIds(formData),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }

  const imageUrl = (formData.get("image_url") as string) || null;
  const { add_on_ids, ...productData } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({ ...productData, image_url: imageUrl })
    .select("id")
    .single();

  if (error || !data) return { error: "تعذر إنشاء المنتج" };

  const product = data as { id: string };
  await syncProductAddOns(product.id, add_on_ids);

  revalidatePath("/dashboard/products");
  return { success: "تم إنشاء المنتج" };
}

export async function updateProduct(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminSession();

  const parsed = productSchema.safeParse({
    category_id: formData.get("category_id"),
    name_ar: formData.get("name_ar"),
    description_ar: formData.get("description_ar") || null,
    price: formData.get("price"),
    is_available:
      formData.get("is_available") === "on" ||
      formData.get("is_available") === "true",
    sort_order: formData.get("sort_order") || 0,
    add_on_ids: parseAddOnIds(formData),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }

  const imageUrl = (formData.get("image_url") as string) || null;
  const { add_on_ids, ...productData } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ ...productData, image_url: imageUrl })
    .eq("id", id);

  if (error) return { error: "تعذر تحديث المنتج" };

  await syncProductAddOns(id, add_on_ids);

  revalidatePath("/dashboard/products");
  return { success: "تم تحديث المنتج" };
}

export async function toggleProductAvailable(
  id: string,
  isAvailable: boolean
): Promise<ActionResult> {
  await requireAdminSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_available: isAvailable })
    .eq("id", id);

  if (error) return { error: "تعذر تحديث حالة المنتج" };

  revalidatePath("/dashboard/products");
  return { success: isAvailable ? "تم تفعيل المنتج" : "تم إيقاف المنتج" };
}
