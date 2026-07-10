"use client";

import {
  formatCategoryProductCount,
  type CategoryFilterItem,
} from "@/lib/menu/category-filter";

interface CategoryCardGridProps {
  categories: CategoryFilterItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function CategoryCardGrid({
  categories,
  selectedId,
  onSelect,
}: CategoryCardGridProps) {
  if (categories.length === 0) return null;

  return (
    <section aria-label="اختر القسم" className="mb-5 sm:mb-6">
      <h2 className="mb-3 text-base font-extrabold text-brand-chocolate sm:text-lg">
        اختر القسم
      </h2>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
        {categories.map((category) => {
          const isActive = category.id === selectedId;
          const isEmpty = category.productCount === 0 && category.name !== "الكل";

          return (
            <button
              key={category.id}
              type="button"
              data-category-card={category.id}
              onClick={() => onSelect(category.id)}
              className={`relative flex min-h-[64px] flex-col items-center justify-center rounded-2xl border px-2.5 py-2 text-center transition focus:outline-none focus:ring-2 focus:ring-brand-orange/35 active:scale-[0.98] motion-reduce:transform-none sm:min-h-[72px] sm:px-3 ${
                isActive
                  ? "border-brand-orange bg-brand-orange-soft text-brand-chocolate"
                  : isEmpty
                    ? "border-brand-gold/35 bg-brand-surface/80 text-brand-muted"
                    : "border-brand-gold/50 bg-brand-surface text-brand-chocolate hover:border-brand-gold"
              }`}
            >
              {isActive ? (
                <span
                  className="absolute top-2 end-2 h-2 w-2 rounded-full bg-brand-orange"
                  aria-hidden="true"
                />
              ) : null}
              <span className="line-clamp-2 w-full text-sm font-extrabold leading-snug sm:text-[15px]">
                {category.name}
              </span>
              <span
                className={`mt-0.5 text-[11px] font-semibold sm:text-xs ${
                  isActive ? "text-brand-muted" : "text-brand-muted"
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
