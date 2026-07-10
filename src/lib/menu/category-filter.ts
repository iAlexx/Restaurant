import type { Category } from "@/types/database";

export interface CategoryMenuItem {
  id: string;
  name: string;
  productCount: number;
  imageUrl: string | null;
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

export function buildCategoryItems(
  categories: Category[],
  products: readonly { category_id: string }[]
): CategoryMenuItem[] {
  const sorted = sortCategoriesStable(categories);
  const counts = countAvailableProductsByCategory(
    products,
    sorted.map((c) => c.id)
  );

  return sorted.map((category) => ({
    id: category.id,
    name: category.name_ar,
    productCount: counts.get(category.id) ?? 0,
    imageUrl: category.image_url ?? null,
  }));
}

export function filterProductsByCategory<T extends { category_id: string }>(
  products: readonly T[],
  selectedCategoryId: string
): T[] {
  return products.filter((p) => p.category_id === selectedCategoryId);
}

export function getCategoryById(
  items: CategoryMenuItem[],
  categoryId: string
): CategoryMenuItem | undefined {
  return items.find((item) => item.id === categoryId);
}
