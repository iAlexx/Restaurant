"use client";

import { useMemo, useState } from "react";
import type { PublicMenu } from "@/lib/menu/public-menu";
import type { Product } from "@/types/database";
import { ProductModal } from "@/components/customer/product-modal";
import { ProductCard } from "@/components/customer/product-card";
import { CategoryCardGrid } from "@/components/customer/category-card-grid";
import { MenuCartCta } from "@/components/customer/menu-cart-cta";
import {
  buildCategoryItems,
  filterProductsByCategory,
  formatCategoryProductCount,
  getCategoryById,
} from "@/lib/menu/category-filter";
import { EmptyState } from "@/components/dashboard/form-ui";
import { useCart } from "@/contexts/cart-context";

export function MenuView({
  menu,
  cartHref,
}: {
  menu: PublicMenu;
  cartHref: string;
}) {
  const { itemCount, hydrated } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const categoryItems = useMemo(
    () => buildCategoryItems(menu.categories, menu.products),
    [menu.categories, menu.products]
  );

  const selectedCategory = selectedCategoryId
    ? getCategoryById(categoryItems, selectedCategoryId)
    : undefined;

  const visibleProducts = useMemo(
    () =>
      selectedCategoryId
        ? filterProductsByCategory(menu.products, selectedCategoryId)
        : [],
    [menu.products, selectedCategoryId]
  );

  const showCartCta = hydrated && itemCount > 0;
  const bottomPadding = showCartCta ? "pb-44 sm:pb-40" : "pb-8";

  function handleAddMore() {
    if (selectedCategoryId) {
      setSelectedCategoryId(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
      <div className={bottomPadding}>
        {selectedCategoryId === null ? (
          <CategoryCardGrid
            categories={categoryItems}
            onSelect={setSelectedCategoryId}
          />
        ) : (
          <>
            <div className="mb-5">
              <button
                type="button"
                onClick={() => setSelectedCategoryId(null)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-brand-gold/45 bg-brand-surface px-3.5 py-2 text-sm font-bold text-brand-chocolate transition hover:border-brand-gold hover:bg-brand-gold-soft/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40"
              >
                <span aria-hidden="true">→</span>
                العودة للأقسام
              </button>
            </div>

            {selectedCategory ? (
              <header className="mb-5 sm:mb-6">
                <h2 className="text-[22px] font-extrabold text-brand-chocolate sm:text-[26px]">
                  {selectedCategory.name}
                </h2>
                <p className="mt-1 text-sm text-brand-muted">
                  {formatCategoryProductCount(selectedCategory.productCount)}
                </p>
                <div
                  className="mt-2.5 h-0.5 w-12 rounded-full bg-brand-gold"
                  aria-hidden="true"
                />
              </header>
            ) : null}

            {visibleProducts.length === 0 ? (
              <EmptyState
                title="لا توجد أصناف متاحة في هذا القسم حالياً"
                description="جرّب قسماً آخر أو عد لاحقاً."
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
          </>
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

      <MenuCartCta cartHref={cartHref} onAddMore={handleAddMore} />
    </>
  );
}
