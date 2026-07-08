/**
 * Format whole integer SYP for display, e.g. 1500 → "1,500 ل.س"
 */
export function formatPrice(amount: number, currencyLabel = "ل.س"): string {
  const formatted = new Intl.NumberFormat("ar-SY").format(amount);
  return `${formatted} ${currencyLabel}`;
}
