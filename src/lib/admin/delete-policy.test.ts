import { describe, expect, it } from "vitest";
import {
  DELETE_CONFIRMATION_WORD,
  buildAddOnDeletePreview,
  buildCategoryDeletePreview,
  buildProductDeletePreview,
  buildTableDeletePreview,
  isTypedConfirmationValid,
} from "@/lib/admin/delete-policy";

describe("delete-policy", () => {
  it("blocks category delete when products exist", () => {
    const preview = buildCategoryDeletePreview("مشروبات", 3);
    expect(preview.canDelete).toBe(false);
    expect(preview.blockReason).toBe(
      "لا يمكن حذف القسم لأنه يحتوي على منتجات"
    );
    expect(preview.dependencyLines[0]).toContain("3");
  });

  it("allows category delete when empty with typed confirmation", () => {
    const preview = buildCategoryDeletePreview("مشروبات", 0);
    expect(preview.canDelete).toBe(true);
    expect(preview.requireTypedConfirmation).toBe(true);
    expect(preview.typedConfirmationExpected).toBe(DELETE_CONFIRMATION_WORD);
  });

  it("allows product delete and warns about historical orders", () => {
    const preview = buildProductDeletePreview("برجر", 5);
    expect(preview.canDelete).toBe(true);
    expect(preview.requireTypedConfirmation).toBe(true);
    expect(preview.dependencyLines[0]).toContain("5");
    expect(preview.dependencyLines[1]).toContain("الطلبات السابقة");
  });

  it("allows product delete without typed confirmation when no orders", () => {
    const preview = buildProductDeletePreview("برجر", 0);
    expect(preview.canDelete).toBe(true);
    expect(preview.requireTypedConfirmation).toBe(false);
  });

  it("blocks add-on delete when linked to products", () => {
    const preview = buildAddOnDeletePreview("جبنة", 2, 0);
    expect(preview.canDelete).toBe(false);
    expect(preview.blockReason).toContain("مرتبطة بمنتجات");
  });

  it("allows add-on delete when only historical orders reference it", () => {
    const preview = buildAddOnDeletePreview("جبنة", 0, 4);
    expect(preview.canDelete).toBe(true);
    expect(preview.requireTypedConfirmation).toBe(true);
    expect(preview.dependencyLines[0]).toContain("4");
  });

  it("blocks table delete when orders exist", () => {
    const preview = buildTableDeletePreview("10", 2);
    expect(preview.canDelete).toBe(false);
    expect(preview.blockReason).toContain("إيقاف الطاولة");
  });

  it("allows table delete when no orders", () => {
    const preview = buildTableDeletePreview("10", 0);
    expect(preview.canDelete).toBe(true);
    expect(preview.requireTypedConfirmation).toBe(true);
  });

  it("validates typed confirmation exactly", () => {
    expect(isTypedConfirmationValid("حذف", DELETE_CONFIRMATION_WORD)).toBe(true);
    expect(isTypedConfirmationValid(" حذف ", DELETE_CONFIRMATION_WORD)).toBe(true);
    expect(isTypedConfirmationValid("delete", DELETE_CONFIRMATION_WORD)).toBe(
      false
    );
  });
});

describe("order snapshot integrity (policy)", () => {
  it("product delete preview documents snapshot preservation", () => {
    const preview = buildProductDeletePreview("برger", 1);
    expect(preview.canDelete).toBe(true);
    expect(preview.dependencyLines.join(" ")).toMatch(/الطلبات السابقة/);
  });

  it("add-on delete preview documents snapshot preservation for historical refs", () => {
    const preview = buildAddOnDeletePreview("صلصة", 0, 1);
    expect(preview.dependencyLines.join(" ")).toMatch(/الطلبات السابقة/);
  });
});
