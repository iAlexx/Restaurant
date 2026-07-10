/** Per-table menu entry cover dismissal (client-only). */

const TABLE_COVER_KEY = "restaurant-dine-in-cover-seen";
const LANDING_COVER_KEY = "restaurant-dine-in-landing-seen";

type TableCoverMap = Record<string, true>;

function readTableCoverMap(): TableCoverMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(TABLE_COVER_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const map: TableCoverMap = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof key === "string" && key.length >= 16 && value === true) {
        map[key] = true;
      }
    }
    return map;
  } catch {
    return {};
  }
}

function writeTableCoverMap(map: TableCoverMap): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TABLE_COVER_KEY, JSON.stringify(map));
}

export function hasSeenTableEntryCover(publicToken: string): boolean {
  if (!publicToken) return false;
  return readTableCoverMap()[publicToken] === true;
}

export function markTableEntryCoverSeen(publicToken: string): void {
  if (typeof window === "undefined" || !publicToken) return;
  const map = readTableCoverMap();
  map[publicToken] = true;
  writeTableCoverMap(map);
}

export function clearTableEntryCoverSeen(publicToken: string): void {
  if (typeof window === "undefined" || !publicToken) return;
  const map = readTableCoverMap();
  delete map[publicToken];
  writeTableCoverMap(map);
}

export function hasSeenLandingCover(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(LANDING_COVER_KEY) === "1";
}

export function markLandingCoverSeen(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LANDING_COVER_KEY, "1");
}

export function clearLandingCoverSeen(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(LANDING_COVER_KEY);
}
