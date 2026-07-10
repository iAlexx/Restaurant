"use client";

import { type RefObject } from "react";
import {
  formatCategoryProductCount,
  type MenuCategoryItem,
} from "@/lib/menu/category-navigation";
import { CategoryFoodIcon } from "@/components/customer/category-food-icon";

interface CategoryCardGridProps {
  categories: MenuCategoryItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  gridRef?: RefObject<HTMLElement | null>;
}

export function CategoryCardGrid({
  categories,
  activeId,
  onSelect,
  gridRef,
}: CategoryCardGridProps) {
  if (categories.length === 0) return null;

  return (
    <section
      ref={gridRef}
      aria-label="اختر القسم"
      className="mb-6 sm:mb-8"
    >
      <h2 className="mb-4 text-lg font-extrabold text-brand-chocolate sm:text-xl">
        اختر القسم
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {categories.map((category) => {
          const isActive = category.id === activeId;
          return (
            <button
              key={category.id}
              type="button"
              data-category-card={category.id}
              onClick={() => onSelect(category.id)}
              className={`flex min-h-[88px] flex-col items-start justify-between rounded-2xl border px-3.5 py-3 text-start transition focus:outline-none focus:ring-2 focus:ring-brand-orange/35 active:scale-[0.98] motion-reduce:transform-none sm:min-h-[100px] sm:rounded-[18px] sm:px-4 sm:py-3.5 md:min-h-[110px] ${
                isActive
                  ? "border-brand-orange bg-brand-orange text-white"
                  : "border-brand-gold/50 bg-brand-surface text-brand-chocolate hover:border-brand-gold"
              }`}
            >
              <CategoryFoodIcon
                className={`h-5 w-5 shrink-0 ${
                  isActive ? "text-white/90" : "text-brand-muted"
                }`}
              />
              <span className="mt-2 line-clamp-2 w-full text-base font-extrabold leading-snug sm:text-[17px]">
                {category.name}
              </span>
              <span
                className={`mt-1 text-xs font-semibold ${
                  isActive ? "text-white/85" : "text-brand-muted"
                }`}
              >
                {formatCategoryProductCount(category.productCount)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
