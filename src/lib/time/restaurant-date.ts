import { RESTAURANT_TIMEZONE } from "@/lib/orders/status-transitions";

/**
 * Local calendar date in the restaurant timezone (YYYY-MM-DD).
 * Assumes Asia/Damascus (UTC+3) — same as order numbers and daily reports.
 */
export function getRestaurantLocalDateString(date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: RESTAURANT_TIMEZONE });
}

/** UTC bounds for a restaurant-local calendar day. */
export function getRestaurantDayUtcBounds(localDateStr: string): {
  start: string;
  end: string;
} {
  const start = new Date(`${localDateStr}T00:00:00+03:00`);
  const end = new Date(`${localDateStr}T23:59:59.999+03:00`);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function formatRestaurantDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ar-SY", {
    timeZone: RESTAURANT_TIMEZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}
