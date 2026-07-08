"use client";

import { useState } from "react";
import { useCart } from "@/contexts/cart-context";
import type { AddOn, Product } from "@/types/database";
import { formatPrice } from "@/lib/money";

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
      notes,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt=""
            className="mb-4 h-48 w-full rounded-xl object-cover"
          />
        ) : null}

        <h2 className="text-xl font-bold text-stone-900">{product.name_ar}</h2>
        {product.description_ar ? (
          <p className="mt-2 text-sm text-stone-600">{product.description_ar}</p>
        ) : null}
        <p className="mt-3 text-lg font-semibold text-amber-700">
          {formatPrice(product.price, currencyLabel)}
        </p>

        {availableAddOns.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-stone-800">الإضافات</p>
            <div className="space-y-2">
              {availableAddOns.map((addOn) => (
                <label
                  key={addOn.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedAddOns.includes(addOn.id)}
                      onChange={() => toggleAddOn(addOn.id)}
                    />
                    {addOn.name_ar}
                  </span>
                  {addOn.extra_price > 0 ? (
                    <span className="text-stone-500">
                      +{formatPrice(addOn.extra_price, currencyLabel)}
                    </span>
                  ) : null}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-stone-800">
            ملاحظات
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={200}
            placeholder="مثال: بدون بصل"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="h-9 w-9 rounded-lg border border-stone-300 text-lg"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span className="w-6 text-center font-medium">{quantity}</span>
            <button
              type="button"
              className="h-9 w-9 rounded-lg border border-stone-300 text-lg"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            >
              +
            </button>
          </div>
          <p className="text-sm text-stone-600">
            {formatPrice(unitTotal * quantity, currencyLabel)}
          </p>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-stone-300 py-2.5 text-sm"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 rounded-lg bg-amber-600 py-2.5 text-sm font-medium text-white"
          >
            أضف إلى السلة
          </button>
        </div>
      </div>
    </div>
  );
}
