export type OrderMode = "dine_in" | "external";

export interface CartLine {
  key: string;
  productId: string;
  quantity: number;
  addOnIds: string[];
  notes: string;
}

export interface CartState {
  lines: CartLine[];
  orderNotes: string;
}

export function cartLineKey(
  productId: string,
  addOnIds: string[],
  notes: string
): string {
  const sorted = [...addOnIds].sort().join(",");
  return `${productId}:${sorted}:${notes.trim()}`;
}

export function createEmptyCart(): CartState {
  return { lines: [], orderNotes: "" };
}
