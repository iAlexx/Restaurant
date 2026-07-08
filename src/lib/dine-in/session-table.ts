/** Client-only convenience cache; URL ?table= token is the source of truth. */

const STORAGE_KEY = "restaurant-dine-in-table-cache";

export interface CachedDineInTable {
  publicToken: string;
  label: string;
}

export function readCachedDineInTable(): CachedDineInTable | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedDineInTable;
    if (
      typeof parsed.publicToken === "string" &&
      typeof parsed.label === "string" &&
      parsed.publicToken.length >= 16
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeCachedDineInTable(table: CachedDineInTable): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(table));
}

export function clearCachedDineInTable(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
