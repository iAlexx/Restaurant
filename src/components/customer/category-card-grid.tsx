"use client";

import {
  formatCategoryProductCount,
  type CategoryMenuItem,
} from "@/lib/menu/category-filter";
import { CategoryImage } from "@/components/customer/category-image";

interface CategoryCardGridProps {
  categories: CategoryMenuItem[];
  onSelect: (id: string) => void;
}

export function CategoryCardGrid({
  categories,
  onSelect,
}: CategoryCardGridProps) {
  if (categories.length === 0) return null;

  return (
    <section aria-label="اختر القسم" className="pb-6">
      <h2 className="mb-4 text-xl font-extrabold text-brand-chocolate sm:text-2xl">
        اختر القسم
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            data-category-card={category.id}
            onClick={() => onSelect(category.id)}
            className="group overflow-hidden rounded-2xl border border-brand-gold/45 bg-brand-surface text-start shadow-sm transition hover:-translate-y-0.5 hover:border-brand-gold hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 active:scale-[0.98] motion-reduce:transform-none"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-brand-cream">
              <CategoryImage
                src={category.imageUrl}
                alt=""
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] motion-reduce:transform-none"
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand-chocolate/25 to-transparent"
                aria-hidden="true"
              />
            </div>

            <div className="space-y-0.5 p-3 sm:p-3.5">
              <span className="line-clamp-2 text-sm font-extrabold leading-snug text-brand-chocolate sm:text-[15px]">
                {category.name}
              </span>
              <span className="block text-xs font-semibold text-brand-muted">
                {formatCategoryProductCount(category.productCount)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
