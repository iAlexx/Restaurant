import type { Category } from "@/types/database";

/** Sentinel id for the "show all products" category card. */
export const ALL_CATEGORIES_ID = "__all__";

export interface CategoryFilterItem {
  id: string;
  name: string;
  productCount: number;
}

export function formatCategoryProductCount(count: number): string {
  if (count === 0) return "0 أصناف";
  if (count === 1) return "1 صنف";
  return `${count} أصناف`;
}

/** Stable sort: sort_order asc, then Arabic name asc. */
export function sortCategoriesStable<T extends Pick<Category, "sort_order" | "name_ar">>(
  categories: T[]
): T[] {
  return [...categories].sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }
    return a.name_ar.localeCompare(b.name_ar, "ar");
  });
}

export function countAvailableProductsByCategory(
  products: readonly { category_id: string }[],
  categoryIds: readonly string[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const id of categoryIds) {
    counts.set(id, 0);
  }
  for (const product of products) {
    counts.set(
      product.category_id,
      (counts.get(product.category_id) ?? 0) + 1
    );
  }
  return counts;
}

export function buildCategoryFilterItems(
  categories: Category[],
  products: readonly { category_id: string }[]
): CategoryFilterItem[] {
  const sorted = sortCategoriesStable(categories);
  const counts = countAvailableProductsByCategory(
    products,
    sorted.map((c) => c.id)
  );

  return [
    {
      id: ALL_CATEGORIES_ID,
      name: "الكل",
      productCount: products.length,
    },
    ...sorted.map((category) => ({
      id: category.id,
      name: category.name_ar,
      productCount: counts.get(category.id) ?? 0,
    })),
  ];
}

export function filterProductsByCategory<T extends { category_id: string }>(
  products: readonly T[],
  selectedCategoryId: string
): T[] {
  if (selectedCategoryId === ALL_CATEGORIES_ID) {
    return [...products];
  }
  return products.filter((p) => p.category_id === selectedCategoryId);
}

export function getSelectedCategoryLabel(
  items: CategoryFilterItem[],
  selectedCategoryId: string
): string | null {
  if (selectedCategoryId === ALL_CATEGORIES_ID) {
    return "كل الأصناف";
  }
  return items.find((item) => item.id === selectedCategoryId)?.name ?? null;
}
