"use client";

import { useState } from "react";
import type { PublicMenu } from "@/lib/menu/public-menu";
import type { Product } from "@/types/database";
import { ProductModal } from "@/components/customer/product-modal";
import { ProductCard } from "@/components/customer/product-card";
import { MenuCategoryNavigation } from "@/components/customer/menu-category-navigation";
import { categorySectionId } from "@/lib/menu/category-navigation";
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

  const navCategories = productsByCategory.map(({ category, products }) => ({
    id: category.id,
    name: category.name_ar,
    productCount: products.length,
  }));

  return (
    <>
      <MenuCategoryNavigation categories={navCategories} />

      <div className="space-y-10 pb-32 sm:space-y-12 sm:pb-28">
        {productsByCategory.map(({ category, products }) => (
          <section
            key={category.id}
            id={categorySectionId(category.id)}
            className="scroll-mt-[118px]"
          >
            <div className="mb-4 sm:mb-5">
              <h2 className="text-[22px] font-extrabold text-brand-chocolate sm:text-[26px]">
                {category.name_ar}
              </h2>
              <div
                className="mt-2 h-0.5 w-12 rounded-full bg-brand-gold"
                aria-hidden="true"
              />
            </div>
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
