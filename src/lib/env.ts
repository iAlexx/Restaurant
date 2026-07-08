export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/**
 * Canonical customer-facing dine-in URL for a table QR code.
 * Single source of truth so QR generation and any link previews stay identical.
 */
export function buildTableUrl(publicToken: string): string {
  return `${getSiteUrl()}/t/${publicToken}`;
}
