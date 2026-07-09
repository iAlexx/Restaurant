import { describe, expect, it } from "vitest";
import {
  extractMenuStoragePath,
  isMenuBucketPublicUrl,
} from "@/lib/storage/menu-bucket";

describe("menu-bucket storage helpers", () => {
  it("extracts storage path from public URL", () => {
    const url =
      "https://example.supabase.co/storage/v1/object/public/menu/products/abc.webp";
    expect(extractMenuStoragePath(url)).toBe("products/abc.webp");
  });

  it("rejects non-menu URLs", () => {
    expect(
      isMenuBucketPublicUrl("https://example.com/images/logo.png")
    ).toBe(false);
    expect(isMenuBucketPublicUrl(null)).toBe(false);
  });

  it("accepts menu bucket URLs", () => {
    expect(
      isMenuBucketPublicUrl(
        "https://example.supabase.co/storage/v1/object/public/menu/logo/uuid.png"
      )
    ).toBe(true);
  });
});
