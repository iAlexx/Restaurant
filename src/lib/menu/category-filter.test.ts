import { describe, expect, it } from "vitest";
import type { Category } from "@/types/database";
import {
  ALL_CATEGORIES_ID,
  buildCategoryFilterItems,
  countAvailableProductsByCategory,
  filterProductsByCategory,
  formatCategoryProductCount,
  getSelectedCategoryLabel,
  sortCategoriesStable,
} from "@/lib/menu/category-filter";

function category(
  id: string,
  name_ar: string,
  sort_order: number
): Category {
  return {
    id,
    name_ar,
    sort_order,
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

describe("category-filter", () => {
  const categories = [
    category("c-drinks", "مشروبات", 1),
    category("c-dessert", "حلويات", 1),
    category("c-main", "أطباق رئيسية", 2),
    category("c-empty", "مقبلات", 3),
  ];

  const products = [
    { id: "p1", category_id: "c-main", name: "Main 1" },
    { id: "p2", category_id: "c-main", name: "Main 2" },
    { id: "p3", category_id: "c-drinks", name: "Drink 1" },
  ];

  it("includes all active categories, including empty ones", () => {
    const items = buildCategoryFilterItems(categories, products);
    expect(items.map((item) => item.id)).toEqual([
      ALL_CATEGORIES_ID,
      "c-dessert",
      "c-drinks",
      "c-main",
      "c-empty",
    ]);
    expect(items.find((item) => item.id === "c-empty")?.productCount).toBe(0);
  });

  it('selects "الكل" by default via ALL_CATEGORIES_ID sentinel', () => {
    const items = buildCategoryFilterItems(categories, products);
    expect(items[0]?.id).toBe(ALL_CATEGORIES_ID);
    expect(items[0]?.name).toBe("الكل");
    expect(items[0]?.productCount).toBe(3);
  });

  it("filters products when a category is selected", () => {
    const filtered = filterProductsByCategory(products, "c-main");
    expect(filtered).toHaveLength(2);
    expect(filtered.every((p) => p.category_id === "c-main")).toBe(true);
  });

  it('restores all products when "الكل" is selected', () => {
    const filtered = filterProductsByCategory(products, ALL_CATEGORIES_ID);
    expect(filtered).toHaveLength(3);
  });

  it("shows zero count for empty categories", () => {
    expect(formatCategoryProductCount(0)).toBe("0 أصناف");
    const counts = countAvailableProductsByCategory(products, ["c-empty"]);
    expect(counts.get("c-empty")).toBe(0);
  });

  it("uses name as stable tie-breaker for duplicate sort_order", () => {
    const sorted = sortCategoriesStable(categories);
    expect(sorted.map((c) => c.id)).toEqual([
      "c-dessert",
      "c-drinks",
      "c-main",
      "c-empty",
    ]);
  });

  it("does not count unavailable products because caller passes available-only products", () => {
    const availableOnly = products.filter((p) => p.id !== "p3");
    const items = buildCategoryFilterItems(categories, availableOnly);
    expect(items.find((item) => item.id === "c-drinks")?.productCount).toBe(0);
    expect(items.find((item) => item.id === ALL_CATEGORIES_ID)?.productCount).toBe(
      2
    );
  });

  it("returns filtered products as a subset without mutating source list", () => {
    const source = [...products];
    const filtered = filterProductsByCategory(source, "c-drinks");
    expect(filtered).toHaveLength(1);
    expect(source).toHaveLength(3);
    expect(filtered[0]?.id).toBe("p3");
  });

  it("returns selected category label for product heading", () => {
    const items = buildCategoryFilterItems(categories, products);
    expect(getSelectedCategoryLabel(items, ALL_CATEGORIES_ID)).toBe("كل الأصناف");
    expect(getSelectedCategoryLabel(items, "c-main")).toBe("أطباق رئيسية");
  });
});
