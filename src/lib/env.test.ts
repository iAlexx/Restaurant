import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildTableUrl, getSiteUrl } from "@/lib/env";
import { generateSecureToken } from "@/lib/tokens";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.VERCEL_URL;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("getSiteUrl", () => {
  it("prefers NEXT_PUBLIC_SITE_URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://alnkha.site";
    process.env.VERCEL_URL = "restaurant-preview.vercel.app";
    expect(getSiteUrl()).toBe("https://alnkha.site");
  });

  it("strips a trailing slash from NEXT_PUBLIC_SITE_URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://alnkha.site/";
    expect(getSiteUrl()).toBe("https://alnkha.site");
  });

  it("never falls back to localhost or a preview URL when the site URL is set", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://alnkha.site";
    const url = getSiteUrl();
    expect(url).not.toContain("localhost");
    expect(url).not.toContain("vercel.app");
  });

  it("uses VERCEL_URL only when NEXT_PUBLIC_SITE_URL is absent", () => {
    process.env.VERCEL_URL = "restaurant-preview.vercel.app";
    expect(getSiteUrl()).toBe("https://restaurant-preview.vercel.app");
  });
});

describe("buildTableUrl", () => {
  it("produces the canonical https://<site>/t/<token> shape", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://alnkha.site";
    const token = generateSecureToken();
    expect(buildTableUrl(token)).toBe(`https://alnkha.site/t/${token}`);
  });

  it("does not double the slash after the domain", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://alnkha.site/";
    expect(buildTableUrl("abc")).toBe("https://alnkha.site/t/abc");
  });
});

describe("table token uniqueness", () => {
  it("generates unique tokens across many tables", () => {
    const count = 1000;
    const tokens = new Set<string>();
    for (let i = 0; i < count; i += 1) {
      tokens.add(generateSecureToken());
    }
    expect(tokens.size).toBe(count);
  });

  it("generates URL-safe hex tokens of sufficient length", () => {
    const token = generateSecureToken();
    expect(token).toMatch(/^[0-9a-f]+$/);
    expect(token.length).toBeGreaterThanOrEqual(32);
  });
});
