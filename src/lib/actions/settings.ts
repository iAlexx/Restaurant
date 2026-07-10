"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/session";
import { weeklyHoursFromForm, normalizeWeeklyOpeningHours } from "@/lib/hours/schedule";
import { DEFAULT_WEEKLY_OPENING_HOURS } from "@/lib/hours/types";
import { createClient } from "@/lib/supabase/server";
import { safeDeleteReplacedMenuImage } from "@/lib/storage/menu-bucket";
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
  const settings = data as RestaurantSettings;
  return {
    ...settings,
    weekly_opening_hours: normalizeWeeklyOpeningHours(
      settings.weekly_opening_hours ?? DEFAULT_WEEKLY_OPENING_HOURS
    ),
  };
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
    weekly_opening_hours: weeklyHoursFromForm(formData),
    is_temporarily_closed:
      formData.get("is_temporarily_closed") === "on" ||
      formData.get("is_temporarily_closed") === "true",
    temporary_closure_message:
      formData.get("temporary_closure_message") || null,
    manual_hours_override:
      formData.get("manual_hours_override_clear") === "on" ||
      formData.get("manual_hours_override_clear") === "true"
        ? null
        : formData.get("manual_hours_override") === "open" ||
            formData.get("manual_hours_override") === "closed"
          ? (formData.get("manual_hours_override") as "open" | "closed")
          : null,
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
    welcome_message: formData.get("welcome_message") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }

  const logoUrl = (formData.get("logo_url") as string) || undefined;
  const heroUrl = (formData.get("hero_image_url") as string) || undefined;

  const supabase = await createClient();

  const { data: existingSettings, error: existingError } = await supabase
    .from("restaurant_settings")
    .select("logo_url, hero_image_url")
    .eq("id", 1)
    .single();

  if (existingError || !existingSettings) {
    return { error: "تعذر تحميل الإعدادات الحالية" };
  }

  const previousLogoUrl = (existingSettings as { logo_url: string | null })
    .logo_url;
  const previousHeroUrl = (existingSettings as { hero_image_url: string | null })
    .hero_image_url;

  const { manual_hours_override_clear: _ignored, ...settingsFields } = parsed.data;
  void _ignored;

  const updatePayload = {
    ...settingsFields,
    weekly_opening_hours: normalizeWeeklyOpeningHours(settingsFields.weekly_opening_hours),
    ...(logoUrl ? { logo_url: logoUrl } : {}),
    ...(heroUrl ? { hero_image_url: heroUrl } : {}),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("restaurant_settings")
    .update(updatePayload)
    .eq("id", 1);

  if (error) return { error: "تعذر حفظ الإعدادات" };

  if (logoUrl && logoUrl !== previousLogoUrl) {
    await safeDeleteReplacedMenuImage(previousLogoUrl, logoUrl);
  }

  if (heroUrl && heroUrl !== previousHeroUrl) {
    await safeDeleteReplacedMenuImage(previousHeroUrl, heroUrl);
  }

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
