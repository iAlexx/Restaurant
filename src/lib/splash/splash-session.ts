/** One lightweight splash per browser session on initial customer entry routes. */

export const SPLASH_SEEN_KEY = "restaurant-splash-seen";

/** Visible hold before fade-out begins (excluding fade-in). */
export const SPLASH_HOLD_MS = 800;

/** Overlay fade-out duration. */
export const SPLASH_FADE_OUT_MS = 250;

/** Target total visible time ≈ fade-in (200ms) + hold + fade-out. */
export const SPLASH_TOTAL_MS = SPLASH_HOLD_MS + SPLASH_FADE_OUT_MS + 200;

export const SPLASH_MAX_MS = 1500;

export function hasSeenSplash(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SPLASH_SEEN_KEY) === "true";
}

export function markSplashSeen(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SPLASH_SEEN_KEY, "true");
}

export function clearSplashSeen(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SPLASH_SEEN_KEY);
}

export function splashTimings(reducedMotion: boolean): {
  holdMs: number;
  fadeOutMs: number;
} {
  if (reducedMotion) {
    return { holdMs: 200, fadeOutMs: 150 };
  }
  return { holdMs: SPLASH_HOLD_MS, fadeOutMs: SPLASH_FADE_OUT_MS };
}
