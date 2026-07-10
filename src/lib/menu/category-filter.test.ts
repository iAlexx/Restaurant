import { describe, expect, it } from "vitest";
import type { Category } from "@/types/database";
import {
  buildCategoryItems,
  countAvailableProductsByCategory,
  filterProductsByCategory,
  formatCategoryProductCount,
  getCategoryById,
  sortCategoriesStable,
} from "@/lib/menu/category-filter";

function category(
  id: string,
  name_ar: string,
  sort_order: number,
  image_url: string | null = null
): Category {
  return {
    id,
    name_ar,
    image_url,
    sort_order,
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

describe("category-filter", () => {
  const categories = [
    category("c-drinks", "مشروبات", 1, "https://example.com/drinks.webp"),
    category("c-dessert", "حلويات", 1),
    category("c-main", "أطباق رئيسية", 2),
    category("c-empty", "مقبلات", 3),
  ];

  const products = [
    { id: "p1", category_id: "c-main", name: "Main 1" },
    { id: "p2", category_id: "c-main", name: "Main 2" },
    { id: "p3", category_id: "c-drinks", name: "Drink 1" },
  ];

  it("includes all active categories, including empty ones, without an all sentinel", () => {
    const items = buildCategoryItems(categories, products);
    expect(items.map((item) => item.id)).toEqual([
      "c-dessert",
      "c-drinks",
      "c-main",
      "c-empty",
    ]);
    expect(items.find((item) => item.id === "c-empty")?.productCount).toBe(0);
    expect(items.find((item) => item.id === "c-drinks")?.imageUrl).toBe(
      "https://example.com/drinks.webp"
    );
  });

  it("filters products when a category is selected", () => {
    const filtered = filterProductsByCategory(products, "c-main");
    expect(filtered).toHaveLength(2);
    expect(filtered.every((p) => p.category_id === "c-main")).toBe(true);
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
    const items = buildCategoryItems(categories, availableOnly);
    expect(items.find((item) => item.id === "c-drinks")?.productCount).toBe(0);
    expect(items.find((item) => item.id === "c-main")?.productCount).toBe(2);
  });

  it("returns filtered products as a subset without mutating source list", () => {
    const source = [...products];
    const filtered = filterProductsByCategory(source, "c-drinks");
    expect(filtered).toHaveLength(1);
    expect(source).toHaveLength(3);
    expect(filtered[0]?.id).toBe("p3");
  });

  it("returns selected category metadata for the products view", () => {
    const items = buildCategoryItems(categories, products);
    expect(getCategoryById(items, "c-main")?.name).toBe("أطباق رئيسية");
    expect(getCategoryById(items, "missing")).toBeUndefined();
  });
});
