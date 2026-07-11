import type { ReceiptPayload } from "../providers/types.js";

export interface ReceiptItemPricing {
  unit_price: number;
  quantity: number;
  line_total: number;
  add_ons: { price: number }[];
}

/** Per-unit add-on prices summed, multiplied by quantity. */
export function computeAddOnsLineTotal(
  addOnUnitPrices: number[],
  quantity: number
): number {
  const perUnit = addOnUnitPrices.reduce((sum, price) => sum + price, 0);
  return perUnit * quantity;
}

/** Expected line total from snapshots: (unit + Σ add-ons per unit) × qty. */
export function computeExpectedLineTotal(
  unitPrice: number,
  quantity: number,
  addOnUnitPrices: number[]
): number {
  const addOnPerUnit = addOnUnitPrices.reduce((sum, price) => sum + price, 0);
  return (unitPrice + addOnPerUnit) * quantity;
}

export function computeExpectedSubtotal(
  items: ReceiptItemPricing[]
): number {
  return items.reduce((sum, item) => sum + item.line_total, 0);
}

export function computeExpectedOrderTotal(
  subtotal: number,
  deliveryFee: number,
  charges: Array<{ amount: number }> = []
): number {
  const chargesTotal = charges.reduce((sum, charge) => sum + charge.amount, 0);
  return subtotal + deliveryFee + chargesTotal;
}

export function verifyReceiptItem(item: ReceiptItemPricing): string | null {
  if (!Number.isInteger(item.unit_price) || item.unit_price < 0) {
    return "invalid unit price";
  }
  if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
    return "invalid quantity";
  }
  if (!Number.isInteger(item.line_total) || item.line_total < 0) {
    return "invalid line total";
  }

  for (const addOn of item.add_ons) {
    if (!Number.isInteger(addOn.price) || addOn.price < 0) {
      return "invalid add-on price";
    }
  }

  const expected = computeExpectedLineTotal(
    item.unit_price,
    item.quantity,
    item.add_ons.map((a) => a.price)
  );

  if (item.line_total !== expected) {
    return `line total ${item.line_total} != expected ${expected}`;
  }

  return null;
}

export function verifyReceiptPayload(receipt: ReceiptPayload): string[] {
  const errors: string[] = [];

  for (let i = 0; i < receipt.items.length; i++) {
    const issue = verifyReceiptItem(receipt.items[i]);
    if (issue) errors.push(`item[${i}]: ${issue}`);
  }

  const expectedSubtotal = computeExpectedSubtotal(receipt.items);
  if (receipt.subtotal !== expectedSubtotal) {
    errors.push(
      `subtotal ${receipt.subtotal} != sum of line totals ${expectedSubtotal}`
    );
  }

  const expectedTotal = computeExpectedOrderTotal(
    receipt.subtotal,
    receipt.delivery_fee,
    receipt.charges
  );
  if (receipt.total !== expectedTotal) {
    errors.push(`total ${receipt.total} != subtotal + delivery + charges ${expectedTotal}`);
  }

  if (!Number.isInteger(receipt.delivery_fee) || receipt.delivery_fee < 0) {
    errors.push("invalid delivery fee");
  }

  return errors;
}

export function addOnLineTotal(addOnUnitPrice: number, quantity: number): number {
  return addOnUnitPrice * quantity;
}
