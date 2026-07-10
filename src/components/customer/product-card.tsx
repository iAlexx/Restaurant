"use client";

import type { Product } from "@/types/database";
import { formatPrice } from "@/lib/money";
import { ProductImage } from "@/components/customer/product-image";

interface ProductCardProps {
  product: Product;
  currencyLabel: string;
  onSelect: () => void;
}

export function ProductCard({
  product,
  currencyLabel,
  onSelect,
}: ProductCardProps) {
  const price = formatPrice(product.price, currencyLabel);

  return (
    <article className="overflow-hidden rounded-2xl border border-brand-gold/35 bg-brand-surface shadow-sm transition hover:-translate-y-0.5 hover:border-brand-gold/55 hover:shadow-md motion-reduce:transform-none">
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full flex-col text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 active:scale-[0.995] motion-reduce:transform-none md:active:scale-100"
      >
        <div className="relative overflow-hidden bg-brand-cream">
          {product.image_url ? (
            <ProductImage
              src={product.image_url}
              variant="card"
              className="rounded-none"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center text-3xl text-brand-muted sm:text-4xl">
              🍽
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3.5 sm:p-4">
          <h3 className="text-base font-extrabold leading-snug text-brand-chocolate sm:text-lg">
            {product.name_ar}
          </h3>
          {product.description_ar ? (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-brand-muted">
              {product.description_ar}
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-brand-muted/70">&nbsp;</p>
          )}

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-brand-gold/25 pt-3">
            <p className="text-lg font-extrabold tabular-nums text-brand-orange sm:text-xl">
              {price}
            </p>
            <span className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-brand-orange px-4 text-sm font-bold text-white">
              أضف للسلة
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}
