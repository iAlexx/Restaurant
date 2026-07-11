import type { OrderType } from "@/types/database";

export type ChargeCalculationType = "PERCENTAGE" | "FIXED";
export type ChargeAppliesTo = "ALL" | OrderType;

export interface RestaurantCharge {
  id: string;
  name_ar: string;
  calculation_type: ChargeCalculationType;
  /** Basis points for PERCENTAGE (1000 = 10%), SYP integer for FIXED */
  value: number;
  is_active: boolean;
  applies_to: ChargeAppliesTo;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PublicCharge {
  id: string;
  name_ar: string;
  calculation_type: ChargeCalculationType;
  value: number;
  applies_to: ChargeAppliesTo;
  sort_order: number;
}

export interface ResolvedChargeSnapshot {
  charge_id: string | null;
  name_snapshot: string;
  calculation_type_snapshot: ChargeCalculationType;
  value_snapshot: number;
  calculated_amount: number;
  sort_order_snapshot: number;
}

export interface OrderChargeRow {
  id: string;
  order_id: string;
  charge_id: string | null;
  name_snapshot: string;
  calculation_type_snapshot: ChargeCalculationType;
  value_snapshot: number;
  calculated_amount: number;
  sort_order_snapshot: number;
  created_at: string;
}

export interface ChargeDisplayLine {
  label: string;
  amount: number;
  sort_order: number;
}
