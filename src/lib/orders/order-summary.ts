import type { OrderType } from "@/types/database";
import type { OrderSummaryLine } from "@/components/customer/order-summary-card";

type OrderItemRow = {
  id: string;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  line_total: number;
  notes: string | null;
};

type AddOnRow = {
  order_item_id: string;
  name_snapshot: string;
  price_snapshot: number;
};

export function buildOrderSummaryLines(
  items: OrderItemRow[],
  addOns: AddOnRow[]
): OrderSummaryLine[] {
  const addOnsByItem = new Map<string, AddOnRow[]>();
  for (const addOn of addOns) {
    const list = addOnsByItem.get(addOn.order_item_id) ?? [];
    list.push(addOn);
    addOnsByItem.set(addOn.order_item_id, list);
  }

  return items.map((item) => ({
    key: item.id,
    name: item.product_name_snapshot,
    quantity: item.quantity,
    lineTotal: item.line_total,
    addOns: (addOnsByItem.get(item.id) ?? []).map((a) => ({
      name: a.name_snapshot,
      price: a.price_snapshot,
    })),
    notes: item.notes,
  }));
}

export type FetchedOrder = {
  order_number: string;
  order_type: OrderType;
  subtotal: number;
  delivery_fee: number;
  total: number;
  table_label_snapshot: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
};
