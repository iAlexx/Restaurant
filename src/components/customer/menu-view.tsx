"use client";

import { useState } from "react";
import type { PublicMenu } from "@/lib/menu/public-menu";
import type { Product } from "@/types/database";
import { ProductModal } from "@/components/customer/product-modal";
import { ProductCard } from "@/components/customer/product-card";
import { CategoryNav } from "@/components/customer/category-nav";
import { EmptyState } from "@/components/dashboard/form-ui";

export function MenuView({ menu }: { menu: PublicMenu }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const productsByCategory = menu.categories
    .map((category) => ({
      category,
      products: menu.products.filter((p) => p.category_id === category.id),
    }))
    .filter(({ products }) => products.length > 0);

  if (productsByCategory.length === 0) {
    return (
      <EmptyState
        title="القائمة غير متوفرة حالياً"
        description="لا توجد أصناف متاحة في الوقت الحالي. يرجى المحاولة لاحقاً أو سؤال الموظف."
      />
    );
  }

  const navCategories = productsByCategory.map(({ category }) => ({
    id: category.id,
    name: category.name_ar,
  }));

  return (
    <>
      <CategoryNav categories={navCategories} />

      <div className="space-y-10 pb-32 pt-2 sm:space-y-12 sm:pb-28 sm:pt-4">
        {productsByCategory.map(({ category, products }) => (
          <section
            key={category.id}
            id={`category-${category.id}`}
            className="scroll-mt-28"
          >
            <h2 className="mb-4 border-b border-brand-gold/40 pb-2 text-[22px] font-extrabold text-brand-chocolate sm:mb-5 sm:text-[28px]">
              {category.name_ar}
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currencyLabel={menu.settings.currency_label}
                  onSelect={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          </section>
        ))}
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
