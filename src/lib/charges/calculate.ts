import type {
  ChargeCalculationType,
  ChargeAppliesTo,
  ChargeDisplayLine,
  PublicCharge,
  ResolvedChargeSnapshot,
  RestaurantCharge,
} from "@/lib/charges/types";
import type { OrderType } from "@/types/database";

/** Percentage stored as basis points: 10% = 1000, 2.5% = 250 */
export const MAX_BASIS_POINTS = 10000;

export function percentInputToBasisPoints(input: number): number {
  return Math.round(input * 100);
}

export function basisPointsToPercentLabel(basisPoints: number): string {
  if (basisPoints % 100 === 0) {
    return String(basisPoints / 100);
  }
  return (basisPoints / 100).toFixed(1).replace(/\.0$/, "");
}

export function formatChargeDisplayLabel(
  name: string,
  calculationType: ChargeCalculationType,
  value: number
): string {
  if (calculationType === "PERCENTAGE") {
    return `${name} ${basisPointsToPercentLabel(value)}%`;
  }
  return name;
}

export function computePercentageChargeAmount(
  subtotal: number,
  basisPoints: number
): number {
  return Math.round((subtotal * basisPoints) / MAX_BASIS_POINTS);
}

export function computeFixedChargeAmount(fixedAmount: number): number {
  return fixedAmount;
}

export function computeChargeAmount(
  subtotal: number,
  calculationType: ChargeCalculationType,
  value: number
): number {
  if (calculationType === "PERCENTAGE") {
    return computePercentageChargeAmount(subtotal, value);
  }
  return computeFixedChargeAmount(value);
}

export function chargeAppliesToOrderType(
  appliesTo: ChargeAppliesTo,
  orderType: OrderType
): boolean {
  return appliesTo === "ALL" || appliesTo === orderType;
}

export function filterChargesForOrderType<T extends { applies_to: ChargeAppliesTo }>(
  charges: T[],
  orderType: OrderType
): T[] {
  return charges.filter((charge) =>
    chargeAppliesToOrderType(charge.applies_to, orderType)
  );
}

export function resolveChargeSnapshots(
  subtotal: number,
  charges: Array<
    Pick<
      RestaurantCharge | PublicCharge,
      | "id"
      | "name_ar"
      | "calculation_type"
      | "value"
      | "sort_order"
    >
  >
): ResolvedChargeSnapshot[] {
  return charges.map((charge) => ({
    charge_id: charge.id,
    name_snapshot: charge.name_ar,
    calculation_type_snapshot: charge.calculation_type,
    value_snapshot: charge.value,
    calculated_amount: computeChargeAmount(
      subtotal,
      charge.calculation_type,
      charge.value
    ),
    sort_order_snapshot: charge.sort_order,
  }));
}

export function sumChargeAmounts(charges: ResolvedChargeSnapshot[]): number {
  return charges.reduce((sum, charge) => sum + charge.calculated_amount, 0);
}

export function computeFinalOrderTotal(
  subtotal: number,
  deliveryFee: number,
  chargeAmounts: number[]
): number {
  const chargesTotal = chargeAmounts.reduce((sum, amount) => sum + amount, 0);
  return subtotal + deliveryFee + chargesTotal;
}

export function toChargeDisplayLines(
  snapshots: ResolvedChargeSnapshot[]
): ChargeDisplayLine[] {
  return [...snapshots]
    .sort((a, b) => a.sort_order_snapshot - b.sort_order_snapshot)
    .map((snapshot) => ({
      label: formatChargeDisplayLabel(
        snapshot.name_snapshot,
        snapshot.calculation_type_snapshot,
        snapshot.value_snapshot
      ),
      amount: snapshot.calculated_amount,
      sort_order: snapshot.sort_order_snapshot,
    }));
}

export interface OrderTotalsWithCharges {
  subtotal: number;
  delivery_fee: number;
  charges: ResolvedChargeSnapshot[];
  charges_total: number;
  total: number;
}

export function computeOrderTotalsWithCharges(
  subtotal: number,
  deliveryFee: number,
  activeCharges: Array<
    Pick<
      RestaurantCharge | PublicCharge,
      "id" | "name_ar" | "calculation_type" | "value" | "sort_order"
    >
  >
): OrderTotalsWithCharges {
  const charges = resolveChargeSnapshots(subtotal, activeCharges);
  const charges_total = sumChargeAmounts(charges);
  const total = subtotal + deliveryFee + charges_total;

  return {
    subtotal,
    delivery_fee: deliveryFee,
    charges,
    charges_total,
    total,
  };
}
