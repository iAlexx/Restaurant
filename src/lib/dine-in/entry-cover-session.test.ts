import { describe, expect, it, beforeEach } from "vitest";
import {
  clearLandingCoverSeen,
  clearTableEntryCoverSeen,
  hasSeenLandingCover,
  hasSeenTableEntryCover,
  markLandingCoverSeen,
  markTableEntryCoverSeen,
} from "@/lib/dine-in/entry-cover-session";
import {
  BUNDLED_DINE_IN_COVER_PATH,
  resolveDineInHeroSrc,
  resolveDineInWelcomeMessage,
} from "@/lib/dine-in/hero-image";

const TOKEN_A = "a".repeat(32);
const TOKEN_B = "b".repeat(32);

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

describe("entry-cover-session", () => {
  beforeEach(() => {
    installSessionStorageMock();
    sessionStorage.clear();
  });

  it("shows table cover on first visit per token", () => {
    expect(hasSeenTableEntryCover(TOKEN_A)).toBe(false);
    markTableEntryCoverSeen(TOKEN_A);
    expect(hasSeenTableEntryCover(TOKEN_A)).toBe(true);
  });

  it("shows cover again for a different table token", () => {
    markTableEntryCoverSeen(TOKEN_A);
    expect(hasSeenTableEntryCover(TOKEN_B)).toBe(false);
  });

  it("clears table cover flag when reopening", () => {
    markTableEntryCoverSeen(TOKEN_A);
    clearTableEntryCoverSeen(TOKEN_A);
    expect(hasSeenTableEntryCover(TOKEN_A)).toBe(false);
  });

  it("shows landing cover once per browser session", () => {
    expect(hasSeenLandingCover()).toBe(false);
    markLandingCoverSeen();
    expect(hasSeenLandingCover()).toBe(true);
    clearLandingCoverSeen();
    expect(hasSeenLandingCover()).toBe(false);
  });

  it("ignores invalid table tokens in storage", () => {
    sessionStorage.setItem(
      "restaurant-dine-in-cover-seen",
      JSON.stringify({ short: true, [TOKEN_A]: true })
    );
    expect(hasSeenTableEntryCover("short")).toBe(false);
    expect(hasSeenTableEntryCover(TOKEN_A)).toBe(true);
  });
});

describe("hero-image helpers", () => {
  it("prefers admin hero_image_url over bundled fallback", () => {
    expect(
      resolveDineInHeroSrc({
        hero_image_url: "https://example.supabase.co/storage/v1/object/public/menu/hero/x.webp",
      })
    ).toBe("https://example.supabase.co/storage/v1/object/public/menu/hero/x.webp");
  });

  it("uses bundled fallback when hero_image_url is missing", () => {
    expect(resolveDineInHeroSrc({ hero_image_url: null })).toBe(
      BUNDLED_DINE_IN_COVER_PATH
    );
    expect(resolveDineInHeroSrc({ hero_image_url: "  " })).toBe(
      BUNDLED_DINE_IN_COVER_PATH
    );
  });

  it("uses custom welcome message when provided", () => {
    expect(
      resolveDineInWelcomeMessage({
        name: "شيخ النكهة",
        welcome_message: "أهلاً وسهلاً",
      })
    ).toBe("أهلاً وسهلاً");
  });

  it("falls back to default welcome copy", () => {
    const message = resolveDineInWelcomeMessage({
      name: "شيخ النكهة",
      welcome_message: null,
    });
    expect(message).toContain("شيخ النكهة");
    expect(message).toContain("اطلب من طاولتك");
  });
});
