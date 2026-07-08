import { describe, expect, it } from "vitest";
import { categorySchema, productSchema, addOnSchema } from "@/lib/validations/menu";
import { tableSchema } from "@/lib/validations/tables";
import { restaurantSettingsSchema } from "@/lib/validations/settings";
import { generateSecureToken, hashToken } from "@/lib/tokens";

describe("categorySchema", () => {
  it("accepts valid category", () => {
    const result = categorySchema.safeParse({
      name_ar: "مقبلات",
      sort_order: 1,
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = categorySchema.safeParse({ name_ar: "", sort_order: 0 });
    expect(result.success).toBe(false);
  });
});

describe("productSchema", () => {
  it("requires integer price", () => {
    const result = productSchema.safeParse({
      category_id: "00000000-0000-4000-8000-000000000001",
      name_ar: "برجر",
      price: 1500,
      sort_order: 0,
      add_on_ids: [],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.price).toBe(1500);
  });

  it("rejects negative price", () => {
    const result = productSchema.safeParse({
      category_id: "00000000-0000-4000-8000-000000000001",
      name_ar: "برجر",
      price: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("addOnSchema", () => {
  it("accepts zero extra price", () => {
    const result = addOnSchema.safeParse({
      name_ar: "جبنة إضافية",
      extra_price: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe("tableSchema", () => {
  it("requires label", () => {
    expect(tableSchema.safeParse({ label: "5" }).success).toBe(true);
    expect(tableSchema.safeParse({ label: "" }).success).toBe(false);
  });
});

describe("restaurantSettingsSchema", () => {
  it("accepts integer fees", () => {
    const result = restaurantSettingsSchema.safeParse({
      name: "مطعمي",
      currency_label: "ل.س",
      delivery_enabled: true,
      pickup_enabled: true,
      default_delivery_fee: 500,
      min_delivery_order: 2000,
    });
    expect(result.success).toBe(true);
  });
});

describe("tokens", () => {
  it("generates unique secure tokens", () => {
    const a = generateSecureToken();
    const b = generateSecureToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });

  it("hashes token consistently", () => {
    const token = "test-token";
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
  });
});
