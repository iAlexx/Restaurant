import { describe, expect, it } from "vitest";
import {
  computeFitDimensions,
  formatFileSizeKb,
  isAllowedProductImageType,
  pickCompressionQuality,
  PRODUCT_IMAGE_HARD_LIMIT_BYTES,
  PRODUCT_IMAGE_MAX_SOURCE_BYTES,
  validateProductSourceFile,
} from "@/lib/images/product-image";

describe("computeFitDimensions", () => {
  it("preserves aspect ratio when scaling down wide image", () => {
    expect(computeFitDimensions(2400, 1200)).toEqual({ width: 1200, height: 600 });
  });

  it("preserves aspect ratio when scaling down tall image", () => {
    expect(computeFitDimensions(800, 2000)).toEqual({ width: 480, height: 1200 });
  });

  it("does not upscale small images", () => {
    expect(computeFitDimensions(400, 300)).toEqual({ width: 400, height: 300 });
  });
});

describe("validateProductSourceFile", () => {
  it("rejects unsupported types", () => {
    const file = new File(["x"], "a.gif", { type: "image/gif" });
    expect(validateProductSourceFile(file)).toMatch(/غير مدعوم/);
  });

  it("rejects extremely large originals", () => {
    const file = new File([new ArrayBuffer(PRODUCT_IMAGE_MAX_SOURCE_BYTES + 1)], "big.jpg", {
      type: "image/jpeg",
    });
    expect(validateProductSourceFile(file)).toMatch(/كبير جداً/);
  });

  it("accepts valid jpeg", () => {
    const file = new File([new ArrayBuffer(1000)], "photo.jpg", {
      type: "image/jpeg",
    });
    expect(validateProductSourceFile(file)).toBeNull();
  });
});

describe("isAllowedProductImageType", () => {
  it("allows webp", () => {
    expect(isAllowedProductImageType("image/webp")).toBe(true);
  });
});

describe("pickCompressionQuality", () => {
  it("never goes below minimum quality", () => {
    expect(pickCompressionQuality(100)).toBeGreaterThanOrEqual(0.75);
  });
});

describe("formatFileSizeKb", () => {
  it("formats kilobytes in Arabic", () => {
    expect(formatFileSizeKb(2048)).toContain("ك.ب");
  });
});

describe("hard limit constant", () => {
  it("is 500 KB", () => {
    expect(PRODUCT_IMAGE_HARD_LIMIT_BYTES).toBe(512000);
  });
});
