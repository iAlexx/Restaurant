"use client";

import Link from "next/link";
import { useCart, estimateCartTotal } from "@/contexts/cart-context";
import type { PublicMenu } from "@/lib/menu/public-menu";
import { formatPrice } from "@/lib/money";
import { QuantityStepper } from "@/components/customer/quantity-stepper";
import { EmptyState, Skeleton } from "@/components/dashboard/form-ui";

export function CartView({
  menu,
  checkoutHref,
  backHref,
  tableLabel,
}: {
  menu: PublicMenu;
  checkoutHref: string;
  backHref: string;
  tableLabel?: string;
}) {
  const { cart, hydrated, updateQuantity, removeLine } = useCart();

  const productMap = new Map(menu.products.map((p) => [p.id, p]));
  const addOnMap = new Map(menu.addOns.map((a) => [a.id, a]));

  const estimatedTotal = estimateCartTotal(
    cart.lines,
    menu.products,
    menu.addOns
  );

  if (!hydrated) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        title="السلة فارغة"
        description="أضف بعض الأصناف من القائمة لتبدأ طلبك."
        action={
          <Link
            href={backHref}
            className="inline-flex rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
          >
            تصفّح القائمة
          </Link>
        }
      />
    );
  }

  return (
    <>
      {tableLabel ? (
        <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          طلبك للطاولة <strong>{tableLabel}</strong>
        </p>
      ) : null}
      <div className="space-y-3 pb-40">
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
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-stone-900">{product.name_ar}</p>
                  {line.addOnIds.length > 0 ? (
                    <ul className="mt-1 space-y-0.5 text-xs text-stone-500">
                      {line.addOnIds.map((id) => (
                        <li key={id}>+ {addOnMap.get(id)?.name_ar}</li>
                      ))}
                    </ul>
                  ) : null}
                  {line.notes ? (
                    <p className="mt-1 text-xs text-stone-500">
                      ملاحظة: {line.notes}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(line.key)}
                  aria-label="حذف الصنف"
                  className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  حذف
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <QuantityStepper
                  size="sm"
                  min={0}
                  value={line.quantity}
                  onChange={(q) => updateQuantity(line.key, q)}
                />
                <p className="font-bold text-amber-700 tabular-nums">
                  {formatPrice(lineTotal, menu.settings.currency_label)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto max-w-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-600">المجموع التقديري</span>
            <span className="text-lg font-bold text-stone-900 tabular-nums">
              {formatPrice(estimatedTotal, menu.settings.currency_label)}
            </span>
          </div>
          <p className="text-[11px] text-stone-400">
            يتم تأكيد السعر النهائي عند إرسال الطلب.
          </p>
          <Link
            href={checkoutHref}
            className="block w-full rounded-2xl bg-amber-600 py-3.5 text-center font-bold text-white transition hover:bg-amber-700"
          >
            متابعة الطلب
          </Link>
        </div>
      </div>
    </>
  );
}
