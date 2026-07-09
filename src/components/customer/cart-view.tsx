"use client";

import Link from "next/link";
import { useCart, estimateCartTotal } from "@/contexts/cart-context";
import type { PublicMenu } from "@/lib/menu/public-menu";
import { formatPrice } from "@/lib/money";
import { QuantityStepper } from "@/components/customer/quantity-stepper";
import { OrderSummaryCard } from "@/components/customer/order-summary-card";
import {
  EmptyState,
  Skeleton,
  buttonPrimaryClassName,
} from "@/components/dashboard/form-ui";

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
          <Link href={backHref} className={buttonPrimaryClassName()}>
            تصفّح القائمة
          </Link>
        }
      />
    );
  }

  const summaryLines = cart.lines
    .map((line) => {
      const product = productMap.get(line.productId);
      if (!product) return null;

      const addOnTotal = line.addOnIds.reduce(
        (s, id) => s + (addOnMap.get(id)?.extra_price ?? 0),
        0
      );
      const lineTotal = (product.price + addOnTotal) * line.quantity;

      return {
        key: line.key,
        name: product.name_ar,
        quantity: line.quantity,
        lineTotal,
        addOns: line.addOnIds.map((id) => ({
          name: addOnMap.get(id)?.name_ar ?? "",
          price: addOnMap.get(id)?.extra_price,
        })),
        notes: line.notes || null,
        actions: (
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => removeLine(line.key)}
              aria-label="حذف الصنف"
              className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              حذف
            </button>
            <QuantityStepper
              size="sm"
              min={0}
              value={line.quantity}
              onChange={(q) => updateQuantity(line.key, q)}
            />
          </div>
        ),
      };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);

  return (
    <>
      {tableLabel ? (
        <p className="mb-3 rounded-xl border border-brand-gold/45 bg-brand-gold-soft px-4 py-2.5 text-sm text-brand-chocolate">
          طلبك للطاولة <strong>{tableLabel}</strong>
        </p>
      ) : null}

      <div className="pb-40">
        <OrderSummaryCard
          variant="cart"
          currencyLabel={menu.settings.currency_label}
          lines={summaryLines}
          subtotal={estimatedTotal}
          total={estimatedTotal}
          tableLabel={tableLabel}
          orderNotes={cart.orderNotes || null}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-brand-gold/40 bg-brand-surface/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto max-w-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-brand-muted">المجموع التقديري</span>
            <span className="text-lg font-bold tabular-nums text-brand-orange">
              {formatPrice(estimatedTotal, menu.settings.currency_label)}
            </span>
          </div>
          <p className="text-[11px] text-brand-muted">
            يتم تأكيد السعر النهائي عند إرسال الطلب.
          </p>
          <Link
            href={checkoutHref}
            className={`${buttonPrimaryClassName()} block w-full rounded-2xl py-3.5 text-center text-base`}
          >
            متابعة الطلب
          </Link>
        </div>
      </div>
    </>
  );
}
