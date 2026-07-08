import { createClient } from "@/lib/supabase/server";
import type { AddOn, Category, Product } from "@/types/database";

export interface PublicRestaurantSettings {
  name: string;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  currency_label: string;
  opening_hours: string | null;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  default_delivery_fee: number;
  min_delivery_order: number;
}

export interface PublicMenuProduct extends Product {
  add_on_ids: string[];
}

export interface PublicMenu {
  settings: PublicRestaurantSettings;
  categories: Category[];
  products: PublicMenuProduct[];
  addOns: AddOn[];
}

export async function fetchPublicMenu(): Promise<PublicMenu> {
  const supabase = await createClient();

  const [settingsRes, categoriesRes, productsRes, addOnsRes, linksRes] =
    await Promise.all([
      supabase.from("restaurant_settings_public").select("*").single(),
      supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("products")
        .select("*")
        .eq("is_available", true)
        .order("sort_order", { ascending: true }),
      supabase.from("add_ons").select("*").eq("is_available", true),
      supabase.from("product_add_ons").select("product_id, add_on_id"),
    ]);

  if (settingsRes.error || !settingsRes.data) {
    throw new Error("تعذر تحميل إعدادات المطعم");
  }

  const addOnMap = new Map<string, string[]>();
  for (const link of linksRes.data ?? []) {
    const row = link as { product_id: string; add_on_id: string };
    const list = addOnMap.get(row.product_id) ?? [];
    list.push(row.add_on_id);
    addOnMap.set(row.product_id, list);
  }

  const activeCategoryIds = new Set(
    ((categoriesRes.data ?? []) as Category[]).map((c) => c.id)
  );

  const products = ((productsRes.data ?? []) as Product[])
    .filter((p) => activeCategoryIds.has(p.category_id))
    .map((p) => ({
      ...p,
      add_on_ids: addOnMap.get(p.id) ?? [],
    }));

  return {
    settings: settingsRes.data as PublicRestaurantSettings,
    categories: (categoriesRes.data ?? []) as Category[],
    products,
    addOns: (addOnsRes.data ?? []) as AddOn[],
  };
}

export interface PublicTable {
  id: string;
  label: string;
  public_token: string;
  is_active: boolean;
}

export async function fetchTableByToken(token: string): Promise<PublicTable | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tables")
    .select("id, label, public_token, is_active")
    .eq("public_token", token)
    .maybeSingle();

  if (error) return null;
  return (data as PublicTable) ?? null;
}

/** Active tables for the unified dine-in table picker (RLS: is_active = true). */
export async function fetchActiveTables(): Promise<
  Pick<PublicTable, "id" | "label" | "public_token">[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tables")
    .select("id, label, public_token")
    .eq("is_active", true)
    .order("label", { ascending: true });

  if (error) return [];
  return (data ?? []) as Pick<PublicTable, "id" | "label" | "public_token">[];
}
