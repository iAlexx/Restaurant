import type { CreateOrderInput } from "@/lib/validations/order";
import type { ResolvedChargeSnapshot } from "@/lib/charges/types";

export interface ResolvedAddOnSnapshot {
  add_on_id: string;
  name_snapshot: string;
  price_snapshot: number;
}

export interface ResolvedLineSnapshot {
  product_id: string;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  line_total: number;
  notes: string | null;
  add_ons: ResolvedAddOnSnapshot[];
}

export interface ResolvedOrderTotals {
  subtotal: number;
  delivery_fee: number;
  charges: ResolvedChargeSnapshot[];
  charges_total: number;
  total: number;
  lines: ResolvedLineSnapshot[];
}

export function computeLineTotal(
  unitPrice: number,
  quantity: number,
  addOnPrices: number[]
): number {
  const addOnTotal = addOnPrices.reduce((sum, p) => sum + p, 0);
  return (unitPrice + addOnTotal) * quantity;
}

export function computeOrderTotals(
  lines: ResolvedLineSnapshot[],
  deliveryFee: number,
  charges: ResolvedChargeSnapshot[] = []
): Pick<
  ResolvedOrderTotals,
  "subtotal" | "delivery_fee" | "charges" | "charges_total" | "total"
> {
  const subtotal = lines.reduce((sum, line) => sum + line.line_total, 0);
  const charges_total = charges.reduce(
    (sum, charge) => sum + charge.calculated_amount,
    0
  );
  const total = subtotal + deliveryFee + charges_total;
  return {
    subtotal,
    delivery_fee: deliveryFee,
    charges,
    charges_total,
    total,
  };
}

export function getInitialOrderStatus(
  orderType: CreateOrderInput["order_type"]
): "NEW" | "WAITING_WHATSAPP_CONFIRMATION" {
  return orderType === "DINE_IN" ? "NEW" : "WAITING_WHATSAPP_CONFIRMATION";
}
