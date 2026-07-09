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
    <article className="group overflow-hidden rounded-2xl border border-brand-gold/40 bg-brand-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none">
      {/* Desktop / tablet: vertical card */}
      <button
        type="button"
        onClick={onSelect}
        className="hidden w-full text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 md:block"
      >
        <div className="relative overflow-hidden bg-brand-cream">
          {product.image_url ? (
            <ProductImage
              src={product.image_url}
              variant="card"
              className="rounded-none"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center text-4xl text-brand-muted">
              🍽
            </div>
          )}
          {product.is_available ? (
            <span className="absolute start-3 top-3 rounded-full bg-brand-green px-2.5 py-0.5 text-xs font-bold text-white">
              متاح
            </span>
          ) : null}
        </div>

        <div className="flex flex-col p-4">
          <h3 className="text-lg font-extrabold leading-snug text-brand-chocolate">
            {product.name_ar}
          </h3>
          {product.description_ar ? (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-brand-muted">
              {product.description_ar}
            </p>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-brand-gold/30 pt-3">
            <p className="text-xl font-extrabold tabular-nums text-brand-orange">
              {price}
            </p>
            <span className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand-orange px-4 text-sm font-bold text-white transition group-hover:bg-brand-orange-hover">
              أضف للسلة
            </span>
          </div>
        </div>
      </button>

      {/* Mobile: horizontal card — image on inline-start (right in RTL) */}
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full gap-3 p-3 text-start active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 md:hidden"
      >
        <div className="relative w-[112px] shrink-0 overflow-hidden rounded-xl bg-brand-cream">
          {product.image_url ? (
            <ProductImage src={product.image_url} variant="card-thumb" />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center text-2xl text-brand-muted">
              🍽
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="text-base font-extrabold leading-snug text-brand-chocolate">
            {product.name_ar}
          </h3>
          {product.description_ar ? (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-brand-muted">
              {product.description_ar}
            </p>
          ) : null}
          <p className="mt-2 text-lg font-extrabold tabular-nums text-brand-orange">
            {price}
          </p>
          <span className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-brand-orange text-sm font-bold text-white">
            أضف للسلة
          </span>
        </div>
      </button>
    </article>
  );
}
