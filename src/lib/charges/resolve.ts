import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeOrderTotalsWithCharges,
  filterChargesForOrderType,
} from "@/lib/charges/calculate";
import type { PublicCharge, RestaurantCharge } from "@/lib/charges/types";
import type { OrderType } from "@/types/database";

export async function fetchActiveRestaurantCharges(
  supabase: SupabaseClient
): Promise<RestaurantCharge[]> {
  const { data, error } = await supabase
    .from("restaurant_charges")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error("تعذر تحميل الرسوم والضرائب");
  }

  return (data ?? []) as RestaurantCharge[];
}

export async function fetchAllRestaurantChargesForAdmin(
  supabase: SupabaseClient
): Promise<RestaurantCharge[]> {
  const { data, error } = await supabase
    .from("restaurant_charges")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RestaurantCharge[];
}

export function resolveApplicableCharges(
  charges: Array<Pick<PublicCharge, "applies_to"> & PublicCharge>,
  orderType: OrderType
): PublicCharge[] {
  return filterChargesForOrderType(charges, orderType);
}

export function buildOrderChargeTotals(
  subtotal: number,
  deliveryFee: number,
  orderType: OrderType,
  charges: RestaurantCharge[] | PublicCharge[]
) {
  const applicable = resolveApplicableCharges(
    charges as PublicCharge[],
    orderType
  );
  return computeOrderTotalsWithCharges(subtotal, deliveryFee, applicable);
}
