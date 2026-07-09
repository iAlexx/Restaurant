"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/contexts/cart-context";
import type { AddOn, Product } from "@/types/database";
import { formatPrice } from "@/lib/money";
import { QuantityStepper } from "@/components/customer/quantity-stepper";
import { ProductImage } from "@/components/customer/product-image";
import { buttonPrimaryClassName } from "@/components/dashboard/form-ui";

interface ProductModalProps {
  product: Product;
  addOns: AddOn[];
  allowedAddOnIds: string[];
  currencyLabel: string;
  onClose: () => void;
}

export function ProductModal({
  product,
  addOns,
  allowedAddOnIds,
  currencyLabel,
  onClose,
}: ProductModalProps) {
  const { addLine } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const availableAddOns = addOns.filter(
    (a) => a.is_available && allowedAddOnIds.includes(a.id)
  );

  const addOnTotal = selectedAddOns.reduce((sum, id) => {
    const addOn = addOns.find((a) => a.id === id);
    return sum + (addOn?.extra_price ?? 0);
  }, 0);

  const unitTotal = product.price + addOnTotal;

  function toggleAddOn(id: string) {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleAdd() {
    addLine({
      productId: product.id,
      quantity,
      addOnIds: selectedAddOns,
      notes: notes.trim(),
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-brand-chocolate/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={product.name_ar}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="motion-modal-up max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-brand-surface shadow-xl outline-none sm:rounded-3xl"
      >
        <div className="relative">
          {product.image_url ? (
            <ProductImage
              src={product.image_url}
              variant="hero"
              priority
            />
          ) : (
            <div className="flex h-32 w-full items-center justify-center bg-brand-cream text-4xl text-brand-muted">
              🍽
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="absolute end-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-surface/95 text-lg font-bold text-brand-chocolate shadow-sm ring-1 ring-brand-border"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          <h2 className="text-xl font-bold text-brand-chocolate">
            {product.name_ar}
          </h2>
          {product.description_ar ? (
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              {product.description_ar}
            </p>
          ) : null}
          <p className="mt-3 text-lg font-bold text-brand-orange">
            {formatPrice(product.price, currencyLabel)}
          </p>

          {availableAddOns.length > 0 ? (
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-brand-chocolate">
                الإضافات
              </p>
              <div className="space-y-2">
                {availableAddOns.map((addOn) => {
                  const checked = selectedAddOns.includes(addOn.id);
                  return (
                    <label
                      key={addOn.id}
                      className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-3 text-sm transition ${
                        checked
                          ? "border-brand-orange/50 bg-brand-orange-soft"
                          : "border-brand-border bg-brand-surface"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAddOn(addOn.id)}
                          className="h-5 w-5 accent-brand-orange"
                        />
                        <span className="font-medium text-brand-chocolate">
                          {addOn.name_ar}
                        </span>
                      </span>
                      {addOn.extra_price > 0 ? (
                        <span className="font-medium text-brand-muted">
                          +{formatPrice(addOn.extra_price, currencyLabel)}
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-5">
            <label
              htmlFor="product-notes"
              className="mb-1.5 block text-sm font-semibold text-brand-chocolate"
            >
              ملاحظات (اختياري)
            </label>
            <input
              id="product-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={200}
              placeholder="مثال: بدون بصل"
              className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 text-sm text-brand-chocolate focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <QuantityStepper value={quantity} onChange={setQuantity} />
            <p className="text-sm text-brand-muted">
              الإجمالي:{" "}
              <span className="font-bold text-brand-chocolate">
                {formatPrice(unitTotal * quantity, currencyLabel)}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className={`${buttonPrimaryClassName()} mt-5 w-full rounded-2xl py-3.5 text-base`}
          >
            أضف إلى السلة
            <span className="tabular-nums">
              · {formatPrice(unitTotal * quantity, currencyLabel)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
