/** Query param carrying the secure table public_token in the unified flow. */
export const UNIFIED_TABLE_QUERY = "table";

export type DineInFlow = "legacy" | "unified";

export interface DineInContext {
  flow: DineInFlow;
  tableToken: string;
  tableLabel: string;
}

function encodeTableToken(publicToken: string): string {
  return encodeURIComponent(publicToken);
}

export function unifiedDineInHref(
  path: "menu" | "cart" | "checkout",
  publicToken: string
): string {
  const q = `${UNIFIED_TABLE_QUERY}=${encodeTableToken(publicToken)}`;
  return `/dine-in/${path}?${q}`;
}

export function unifiedDineInSuccessHref(
  publicToken: string,
  orderId: string
): string {
  return `/dine-in/success/${orderId}?${UNIFIED_TABLE_QUERY}=${encodeTableToken(publicToken)}`;
}

export function legacyDineInHref(
  path: "menu" | "cart" | "checkout",
  publicToken: string
): string {
  if (path === "menu") return `/t/${publicToken}`;
  return `/t/${publicToken}/${path}`;
}

export function legacyDineInSuccessBase(publicToken: string): string {
  return `/t/${publicToken}/success`;
}

export function dineInMenuHref(ctx: Pick<DineInContext, "flow" | "tableToken">): string {
  return ctx.flow === "unified"
    ? unifiedDineInHref("menu", ctx.tableToken)
    : legacyDineInHref("menu", ctx.tableToken);
}

export function dineInCartHref(ctx: Pick<DineInContext, "flow" | "tableToken">): string {
  return ctx.flow === "unified"
    ? unifiedDineInHref("cart", ctx.tableToken)
    : legacyDineInHref("cart", ctx.tableToken);
}

export function dineInCheckoutHref(ctx: Pick<DineInContext, "flow" | "tableToken">): string {
  return ctx.flow === "unified"
    ? unifiedDineInHref("checkout", ctx.tableToken)
    : legacyDineInHref("checkout", ctx.tableToken);
}

export function dineInSuccessPath(
  ctx: Pick<DineInContext, "flow" | "tableToken">,
  orderId: string
): string {
  return ctx.flow === "unified"
    ? unifiedDineInSuccessHref(ctx.tableToken, orderId)
    : `${legacyDineInSuccessBase(ctx.tableToken)}/${orderId}`;
}

export function parseUnifiedTableParam(
  value: string | string[] | undefined
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length >= 16 ? trimmed : null;
}
