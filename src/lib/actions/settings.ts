"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { generateSecureToken, hashToken } from "@/lib/tokens";
import {
  printDeviceSchema,
  restaurantSettingsSchema,
} from "@/lib/validations/settings";
import type { PrintDevice, RestaurantSettings } from "@/types/database";
import type { ActionResult, ActionResultWithToken } from "@/lib/actions/types";

export async function getRestaurantSettings(): Promise<RestaurantSettings> {
  await requireAdminSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurant_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) throw new Error("تعذر تحميل الإعدادات");
  return data as RestaurantSettings;
}

export async function updateRestaurantSettings(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminSession();

  const parsed = restaurantSettingsSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || null,
    whatsapp_phone: formData.get("whatsapp_phone") || null,
    address: formData.get("address") || null,
    currency_label: formData.get("currency_label"),
    opening_hours: formData.get("opening_hours") || null,
    delivery_enabled:
      formData.get("delivery_enabled") === "on" ||
      formData.get("delivery_enabled") === "true",
    pickup_enabled:
      formData.get("pickup_enabled") === "on" ||
      formData.get("pickup_enabled") === "true",
    default_delivery_fee: formData.get("default_delivery_fee") ?? 0,
    min_delivery_order: formData.get("min_delivery_order") ?? 0,
    receipt_header: formData.get("receipt_header") || null,
    receipt_footer: formData.get("receipt_footer") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }

  const logoUrl = (formData.get("logo_url") as string) || undefined;

  const supabase = await createClient();
  const updatePayload = logoUrl
    ? { ...parsed.data, logo_url: logoUrl, updated_at: new Date().toISOString() }
    : { ...parsed.data, updated_at: new Date().toISOString() };

  const { error } = await supabase
    .from("restaurant_settings")
    .update(updatePayload)
    .eq("id", 1);

  if (error) return { error: "تعذر حفظ الإعدادات" };

  revalidatePath("/dashboard/settings");
  return { success: "تم حفظ الإعدادات" };
}

export interface PrintDeviceListItem {
  id: string;
  name: string;
  is_active: boolean;
  last_heartbeat_at: string | null;
  last_error: string | null;
  created_at: string;
}

export async function listPrintDevices(): Promise<PrintDeviceListItem[]> {
  await requireAdminSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("print_devices")
    .select("id, name, is_active, last_heartbeat_at, last_error, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PrintDeviceListItem[];
}

export async function createPrintDevice(
  _prev: ActionResultWithToken,
  formData: FormData
): Promise<ActionResultWithToken> {
  await requireAdminSession();

  const parsed = printDeviceSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }

  const token = generateSecureToken();
  const tokenHash = hashToken(token);

  const supabase = await createClient();
  const { error } = await supabase.from("print_devices").insert({
    name: parsed.data.name,
    token_hash: tokenHash,
    is_active: true,
  });

  if (error) return { error: "تعذر إنشاء جهاز الطباعة" };

  revalidatePath("/dashboard/settings");
  return {
    success: "تم إنشاء جهاز الطباعة. انسخ الرمز الآن — لن يظهر مرة أخرى.",
    token,
  };
}

export async function revokePrintDevice(id: string): Promise<ActionResult> {
  await requireAdminSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("print_devices")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return { error: "تعذر إلغاء الجهاز" };

  revalidatePath("/dashboard/settings");
  return { success: "تم إلغاء تفعيل جهاز الطباعة" };
}

export type { PrintDevice };
