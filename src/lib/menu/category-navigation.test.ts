import { describe, expect, it } from "vitest";
import {
  formatCategoryProductCount,
  getCategoryScrollOffset,
  categorySectionId,
} from "@/lib/menu/category-navigation";

describe("category-navigation helpers", () => {
  it("formats product counts in Arabic", () => {
    expect(formatCategoryProductCount(8)).toBe("8 أصناف");
    expect(formatCategoryProductCount(1)).toBe("1 صنف");
  });

  it("computes scroll offset with and without sticky nav", () => {
    expect(getCategoryScrollOffset(false)).toBe(74);
    expect(getCategoryScrollOffset(true)).toBe(118);
  });

  it("builds stable section anchor ids", () => {
    expect(categorySectionId("abc-123")).toBe("category-abc-123");
  });
});
