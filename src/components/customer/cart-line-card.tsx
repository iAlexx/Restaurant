"use client";

import { formatPrice } from "@/lib/money";
import { ProductImage } from "@/components/customer/product-image";
import { QuantityStepper } from "@/components/customer/quantity-stepper";

export interface CartLineCardProps {
  name: string;
  imageUrl?: string | null;
  quantity: number;
  lineTotal: number;
  currencyLabel: string;
  addOns: { name: string; price?: number }[];
  notes?: string | null;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export function CartLineCard({
  name,
  imageUrl,
  quantity,
  lineTotal,
  currencyLabel,
  addOns,
  notes,
  onQuantityChange,
  onRemove,
}: CartLineCardProps) {
  return (
    <article className="rounded-2xl border border-brand-gold/40 bg-brand-surface p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="h-[72px] w-[96px] shrink-0 overflow-hidden rounded-xl bg-brand-cream">
          {imageUrl ? (
            <ProductImage
              src={imageUrl}
              variant="card-thumb"
              className="h-full w-full rounded-xl"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl text-brand-muted">
              🍽
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-extrabold leading-snug text-brand-chocolate">
              {name}
            </h3>
            <button
              type="button"
              onClick={onRemove}
              aria-label="حذف الصنف"
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
            >
              حذف
            </button>
          </div>

          {addOns.length > 0 ? (
            <ul className="mt-1.5 space-y-0.5">
              {addOns.map((addOn, i) => (
                <li
                  key={`${addOn.name}-${i}`}
                  className="text-sm text-brand-muted"
                >
                  + {addOn.name}
                  {addOn.price != null && addOn.price > 0
                    ? ` (${formatPrice(addOn.price, currencyLabel)})`
                    : null}
                </li>
              ))}
            </ul>
          ) : null}

          {notes ? (
            <p className="mt-2 rounded-lg border border-brand-gold/40 bg-brand-gold-soft px-2.5 py-1.5 text-xs leading-relaxed text-brand-chocolate">
              ملاحظة: {notes}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-brand-gold/30 pt-3">
        <QuantityStepper
          size="sm"
          min={0}
          value={quantity}
          onChange={onQuantityChange}
        />
        <p className="text-lg font-extrabold tabular-nums text-brand-orange">
          {formatPrice(lineTotal, currencyLabel)}
        </p>
      </div>
    </article>
  );
}
