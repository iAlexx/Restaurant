"use client";

import { useState } from "react";
import type { PublicMenu } from "@/lib/menu/public-menu";
import type { Product } from "@/types/database";
import { formatPrice } from "@/lib/money";
import { ProductModal } from "@/components/customer/product-modal";
import { ProductImage } from "@/components/customer/product-image";
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

      <div className="space-y-8 pb-28 pt-4">
        {productsByCategory.map(({ category, products }) => (
          <section
            key={category.id}
            id={`category-${category.id}`}
            className="scroll-mt-24"
          >
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-stone-900">
              <span className="h-5 w-1.5 rounded-full bg-amber-500" />
              {category.name_ar}
            </h2>
            <div className="space-y-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  className="flex w-full gap-3 rounded-2xl border border-stone-200 bg-white p-3 text-start shadow-sm transition hover:border-amber-300 hover:shadow-md active:scale-[0.99]"
                >
                  {product.image_url ? (
                    <ProductImage src={product.image_url} variant="thumb" />
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-2xl text-stone-300">
                      🍽
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="font-bold text-stone-900">{product.name_ar}</p>
                    {product.description_ar ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">
                        {product.description_ar}
                      </p>
                    ) : null}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <p className="font-bold text-amber-700">
                        {formatPrice(
                          product.price,
                          menu.settings.currency_label
                        )}
                      </p>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-lg font-bold text-amber-700">
                        +
                      </span>
                    </div>
                  </div>
                </button>
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
