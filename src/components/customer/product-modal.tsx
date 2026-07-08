"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/contexts/cart-context";
import type { AddOn, Product } from "@/types/database";
import { formatPrice } from "@/lib/money";
import { QuantityStepper } from "@/components/customer/quantity-stepper";
import { ProductImage } from "@/components/customer/product-image";

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={product.name_ar}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-xl outline-none sm:rounded-3xl"
      >
        <div className="relative">
          {product.image_url ? (
            <ProductImage
              src={product.image_url}
              variant="hero"
              priority
            />
          ) : (
            <div className="flex h-32 w-full items-center justify-center bg-stone-100 text-4xl text-stone-300">
              🍽
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-stone-700 shadow-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          <h2 className="text-xl font-bold text-stone-900">{product.name_ar}</h2>
          {product.description_ar ? (
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              {product.description_ar}
            </p>
          ) : null}
          <p className="mt-3 text-lg font-bold text-amber-700">
            {formatPrice(product.price, currencyLabel)}
          </p>

          {availableAddOns.length > 0 ? (
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-stone-800">
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
                          ? "border-amber-400 bg-amber-50"
                          : "border-stone-200 bg-white"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAddOn(addOn.id)}
                          className="h-5 w-5 accent-amber-600"
                        />
                        <span className="font-medium text-stone-800">
                          {addOn.name_ar}
                        </span>
                      </span>
                      {addOn.extra_price > 0 ? (
                        <span className="font-medium text-stone-500">
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
              className="mb-1.5 block text-sm font-semibold text-stone-800"
            >
              ملاحظات (اختياري)
            </label>
            <input
              id="product-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={200}
              placeholder="مثال: بدون بصل"
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <QuantityStepper value={quantity} onChange={setQuantity} />
            <p className="text-sm text-stone-500">
              الإجمالي:{" "}
              <span className="font-bold text-stone-900">
                {formatPrice(unitTotal * quantity, currencyLabel)}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3.5 text-base font-bold text-white transition hover:bg-amber-700"
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
