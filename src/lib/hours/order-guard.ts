import type { SupabaseClient } from "@supabase/supabase-js";
import { OrderValidationError } from "@/lib/orders/validate-order";
import {
  computeRestaurantOpenStatus,
  CUSTOMER_ORDER_CLOSED_MESSAGE,
} from "@/lib/hours/restaurant-status";
import type { OpeningHoursSettings } from "@/lib/hours/types";

const HOURS_SELECT =
  "weekly_opening_hours, is_temporarily_closed, temporary_closure_message, manual_hours_override, manual_hours_override_until";

export async function fetchOpeningHoursSettings(
  supabase: SupabaseClient
): Promise<OpeningHoursSettings | null> {
  const { data, error } = await supabase
    .from("restaurant_settings")
    .select(HOURS_SELECT)
    .eq("id", 1)
    .single();

  if (error || !data) return null;
  return data as OpeningHoursSettings;
}

export async function assertRestaurantAcceptsCustomerOrders(
  supabase: SupabaseClient,
  at: Date = new Date()
): Promise<void> {
  const settings = await fetchOpeningHoursSettings(supabase);
  if (!settings) {
    throw new OrderValidationError("تعذر تحميل إعدادات المطعم", 500);
  }

  const status = computeRestaurantOpenStatus(settings, at);
  if (!status.isAcceptingCustomerOrders) {
    throw new OrderValidationError(CUSTOMER_ORDER_CLOSED_MESSAGE, 403);
  }
}

export async function getRestaurantOpenStatusFromDb(
  supabase: SupabaseClient,
  at: Date = new Date()
) {
  const settings = await fetchOpeningHoursSettings(supabase);
  return computeRestaurantOpenStatus(settings ?? undefined, at);
}
