"use client";

import Link from "next/link";
import { useCart, estimateCartTotal } from "@/contexts/cart-context";
import type { PublicMenu } from "@/lib/menu/public-menu";
import { formatPrice } from "@/lib/money";

export function CartView({
  menu,
  checkoutHref,
  backHref,
}: {
  menu: PublicMenu;
  checkoutHref: string;
  backHref: string;
}) {
  const { cart, updateQuantity, removeLine } = useCart();

  const productMap = new Map(menu.products.map((p) => [p.id, p]));
  const addOnMap = new Map(menu.addOns.map((a) => [a.id, a]));

  const estimatedTotal = estimateCartTotal(
    cart.lines,
    menu.products,
    menu.addOns
  );

  if (cart.lines.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-stone-600">السلة فارغة</p>
        <Link href={backHref} className="mt-4 inline-block text-amber-700 underline">
          العودة إلى القائمة
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {cart.lines.map((line) => {
        const product = productMap.get(line.productId);
        if (!product) return null;

        const addOnTotal = line.addOnIds.reduce(
          (s, id) => s + (addOnMap.get(id)?.extra_price ?? 0),
          0
        );
        const lineTotal = (product.price + addOnTotal) * line.quantity;

        return (
          <div
            key={line.key}
            className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-stone-900">{product.name_ar}</p>
                {line.addOnIds.length > 0 ? (
                  <ul className="mt-1 text-xs text-stone-500">
                    {line.addOnIds.map((id) => (
                      <li key={id}>+ {addOnMap.get(id)?.name_ar}</li>
                    ))}
                  </ul>
                ) : null}
                {line.notes ? (
                  <p className="mt-1 text-xs text-stone-500">ملاحظة: {line.notes}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => removeLine(line.key)}
                className="text-sm text-red-600"
              >
                حذف
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-8 w-8 rounded border border-stone-300"
                  onClick={() => updateQuantity(line.key, line.quantity - 1)}
                >
                  −
                </button>
                <span>{line.quantity}</span>
                <button
                  type="button"
                  className="h-8 w-8 rounded border border-stone-300"
                  onClick={() => updateQuantity(line.key, line.quantity + 1)}
                >
                  +
                </button>
              </div>
              <p className="font-medium text-amber-700">
                {formatPrice(lineTotal, menu.settings.currency_label)}
              </p>
            </div>
          </div>
        );
      })}

      <div className="rounded-xl bg-stone-50 p-4">
        <p className="text-sm text-stone-600">
          المجموع التقديري (سيتم تأكيد السعر عند الإرسال)
        </p>
        <p className="mt-1 text-xl font-bold text-stone-900">
          {formatPrice(estimatedTotal, menu.settings.currency_label)}
        </p>
      </div>

      <Link
        href={checkoutHref}
        className="block w-full rounded-xl bg-amber-600 py-3 text-center font-medium text-white"
      >
        متابعة الطلب
      </Link>
    </div>
  );
}
