"use client";

import { useState } from "react";
import type { PublicMenu } from "@/lib/menu/public-menu";
import type { Product } from "@/types/database";
import { formatPrice } from "@/lib/money";
import { ProductModal } from "@/components/customer/product-modal";

export function MenuView({ menu }: { menu: PublicMenu }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const productsByCategory = menu.categories.map((category) => ({
    category,
    products: menu.products.filter((p) => p.category_id === category.id),
  }));

  return (
    <>
      <div className="space-y-8 pb-8">
        {productsByCategory.map(({ category, products }) =>
          products.length === 0 ? null : (
            <section key={category.id}>
              <h2 className="mb-3 text-lg font-bold text-stone-900">
                {category.name_ar}
              </h2>
              <div className="space-y-3">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className="flex w-full gap-3 rounded-xl border border-stone-200 bg-white p-3 text-start shadow-sm transition hover:border-amber-300"
                  >
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image_url}
                        alt=""
                        className="h-20 w-20 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-400">
                        —
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stone-900">
                        {product.name_ar}
                      </p>
                      {product.description_ar ? (
                        <p className="mt-1 line-clamp-2 text-xs text-stone-500">
                          {product.description_ar}
                        </p>
                      ) : null}
                      <p className="mt-2 font-medium text-amber-700">
                        {formatPrice(product.price, menu.settings.currency_label)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )
        )}
      </div>

      {selectedProduct ? (
        <ProductModal
          product={selectedProduct}
          addOns={menu.addOns}
          allowedAddOnIds={
            menu.products.find((p) => p.id === selectedProduct.id)?.add_on_ids ??
            []
          }
          currencyLabel={menu.settings.currency_label}
          onClose={() => setSelectedProduct(null)}
        />
      ) : null}
    </>
  );
}
