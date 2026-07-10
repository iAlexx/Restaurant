import { describe, expect, it, beforeEach } from "vitest";
import {
  SPLASH_FADE_OUT_MS,
  SPLASH_HOLD_MS,
  SPLASH_SEEN_KEY,
  SPLASH_TOTAL_MS,
  clearSplashSeen,
  hasSeenSplash,
  markSplashSeen,
  splashTimings,
} from "@/lib/splash/splash-session";

function installSessionStorageMock(): void {
  const store = new Map<string, string>();
  const sessionStorageMock = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };

  Object.defineProperty(globalThis, "sessionStorage", {
    value: sessionStorageMock,
    configurable: true,
  });

  Object.defineProperty(globalThis, "window", {
    value: globalThis,
    configurable: true,
  });
}

describe("splash-session", () => {
  beforeEach(() => {
    installSessionStorageMock();
    sessionStorage.clear();
  });

  it("shows splash only once per browser session", () => {
    expect(hasSeenSplash()).toBe(false);
    markSplashSeen();
    expect(hasSeenSplash()).toBe(true);
    expect(sessionStorage.getItem(SPLASH_SEEN_KEY)).toBe("true");
  });

  it("clears splash seen flag", () => {
    markSplashSeen();
    clearSplashSeen();
    expect(hasSeenSplash()).toBe(false);
  });

  it("uses target hold and fade timings within spec", () => {
    expect(SPLASH_HOLD_MS).toBe(2000);
    expect(SPLASH_FADE_OUT_MS).toBe(250);
    expect(SPLASH_TOTAL_MS).toBe(2250);
  });

  it("shortens timings for reduced motion", () => {
    const normal = splashTimings(false);
    const reduced = splashTimings(true);
    expect(reduced.holdMs).toBeLessThan(normal.holdMs);
    expect(reduced.fadeOutMs).toBeLessThan(normal.fadeOutMs);
  });
});
