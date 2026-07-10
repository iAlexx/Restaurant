/** Layout constants for menu category scroll + sticky offsets. */

export const MENU_STICKY_HEADER_PX = 66;

/** Compact sticky category row height (approx). */
export const MENU_STICKY_CATEGORY_NAV_PX = 44;

/** Extra breathing room below sticky bars when scrolling to a section. */
export const MENU_CATEGORY_SCROLL_PADDING_PX = 8;

export interface MenuCategoryItem {
  id: string;
  name: string;
  productCount: number;
}

export function formatCategoryProductCount(count: number): string {
  if (count === 1) return "1 صنف";
  return `${count} أصناف`;
}

export function getCategoryScrollOffset(stickyNavVisible: boolean): number {
  return (
    MENU_STICKY_HEADER_PX +
    (stickyNavVisible ? MENU_STICKY_CATEGORY_NAV_PX : 0) +
    MENU_CATEGORY_SCROLL_PADDING_PX
  );
}

export function categorySectionId(categoryId: string): string {
  return `category-${categoryId}`;
}
