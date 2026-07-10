"use client";

import { useMemo, useState } from "react";
import type { PublicMenu } from "@/lib/menu/public-menu";
import type { Product } from "@/types/database";
import { ProductModal } from "@/components/customer/product-modal";
import { ProductCard } from "@/components/customer/product-card";
import { CategoryCardGrid } from "@/components/customer/category-card-grid";
import {
  ALL_CATEGORIES_ID,
  buildCategoryFilterItems,
  filterProductsByCategory,
  formatCategoryProductCount,
  getSelectedCategoryLabel,
} from "@/lib/menu/category-filter";
import { EmptyState } from "@/components/dashboard/form-ui";

export function MenuView({ menu }: { menu: PublicMenu }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>(ALL_CATEGORIES_ID);

  const categoryItems = useMemo(
    () => buildCategoryFilterItems(menu.categories, menu.products),
    [menu.categories, menu.products]
  );

  const visibleProducts = useMemo(
    () => filterProductsByCategory(menu.products, selectedCategoryId),
    [menu.products, selectedCategoryId]
  );

  const selectedLabel = getSelectedCategoryLabel(
    categoryItems,
    selectedCategoryId
  );
  const selectedCount = visibleProducts.length;

  if (menu.categories.length === 0) {
    return (
      <EmptyState
        title="القائمة غير متوفرة حالياً"
        description="لا توجد أقسام متاحة في الوقت الحالي."
      />
    );
  }

  return (
    <>
      <CategoryCardGrid
        categories={categoryItems}
        selectedId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
      />

      <div className="pb-32 sm:pb-28">
        {selectedLabel ? (
          <header className="mb-4 sm:mb-5">
            <h2 className="text-[22px] font-extrabold text-brand-chocolate sm:text-[26px]">
              {selectedLabel}
            </h2>
            <p className="mt-1 text-sm text-brand-muted">
              {formatCategoryProductCount(selectedCount)}
            </p>
            <div
              className="mt-2 h-0.5 w-12 rounded-full bg-brand-gold"
              aria-hidden="true"
            />
          </header>
        ) : null}

        {visibleProducts.length === 0 ? (
          <EmptyState
            title={
              selectedCategoryId === ALL_CATEGORIES_ID
                ? "القائمة غير متوفرة حالياً"
                : "لا توجد أصناف متاحة في هذا القسم حالياً"
            }
            description={
              selectedCategoryId === ALL_CATEGORIES_ID
                ? "لا توجد أصناف متاحة في الوقت الحالي. يرجى المحاولة لاحقاً أو سؤال الموظف."
                : "جرّب قسماً آخر أو عد لاحقاً."
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currencyLabel={menu.settings.currency_label}
                onSelect={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedProduct ? (
        <ProductModal
          product={selectedProduct}
          addOns={menu.addOns}
          allowedAddOnIds={
            menu.products.find((p) => p.id === selectedProduct.id)
              ?.add_on_ids ?? []
          }
          currencyLabel={menu.settings.currency_label}
          onClose={() => setSelectedProduct(null)}
        />
      ) : null}
    </>
  );
}
