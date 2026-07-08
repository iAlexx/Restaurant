import type { CreateOrderInput } from "@/lib/validations/order";

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
  deliveryFee: number
): Pick<ResolvedOrderTotals, "subtotal" | "delivery_fee" | "total"> {
  const subtotal = lines.reduce((sum, line) => sum + line.line_total, 0);
  const total = subtotal + deliveryFee;
  return { subtotal, delivery_fee: deliveryFee, total };
}

export function getInitialOrderStatus(
  orderType: CreateOrderInput["order_type"]
): "NEW" | "WAITING_WHATSAPP_CONFIRMATION" {
  return orderType === "DINE_IN" ? "NEW" : "WAITING_WHATSAPP_CONFIRMATION";
}
