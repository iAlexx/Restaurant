"use client";

import Link from "next/link";
import { useCart, estimateCartTotal } from "@/contexts/cart-context";
import type { PublicMenu } from "@/lib/menu/public-menu";
import { formatPrice } from "@/lib/money";
import { CartLineCard } from "@/components/customer/cart-line-card";
import { OrderSummaryCard } from "@/components/customer/order-summary-card";
import {
  EmptyState,
  Skeleton,
  buttonPrimaryClassName,
} from "@/components/dashboard/form-ui";
import { customerContainerClassName } from "@/components/customer/customer-menu-shell";

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
      <div className="space-y-4">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
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
        product,
        lineTotal,
        addOns: line.addOnIds.map((id) => ({
          name: addOnMap.get(id)?.name_ar ?? "",
          price: addOnMap.get(id)?.extra_price,
        })),
        notes: line.notes || null,
        quantity: line.quantity,
      };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);

  return (
    <>
      <div className="space-y-4 pb-44 lg:pb-36">
        <h2 className="text-lg font-extrabold text-brand-chocolate">
          أصناف طلبك
        </h2>
        <div className="space-y-3">
          {summaryLines.map((line) => (
            <CartLineCard
              key={line.key}
              name={line.product.name_ar}
              imageUrl={line.product.image_url}
              quantity={line.quantity}
              lineTotal={line.lineTotal}
              currencyLabel={menu.settings.currency_label}
              addOns={line.addOns}
              notes={line.notes}
              onQuantityChange={(q) => updateQuantity(line.key, q)}
              onRemove={() => removeLine(line.key)}
            />
          ))}
        </div>

        <OrderSummaryCard
          variant="cart"
          currencyLabel={menu.settings.currency_label}
          lines={summaryLines.map((line) => ({
            key: line.key,
            name: line.product.name_ar,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
            addOns: line.addOns,
            notes: line.notes,
          }))}
          subtotal={estimatedTotal}
          total={estimatedTotal}
          tableLabel={tableLabel}
          orderNotes={cart.orderNotes || null}
          totalsOnly
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-brand-gold/40 bg-brand-surface/95 backdrop-blur">
        <div
          className={`${customerContainerClassName} space-y-2 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]`}
        >
          <div className="flex items-center justify-between text-sm sm:text-base">
            <span className="text-brand-muted">المجموع التقديري</span>
            <span className="text-xl font-extrabold tabular-nums text-brand-orange">
              {formatPrice(estimatedTotal, menu.settings.currency_label)}
            </span>
          </div>
          <p className="text-xs text-brand-muted">
            يتم تأكيد السعر النهائي عند إرسال الطلب.
          </p>
          <Link
            href={checkoutHref}
            className={`${buttonPrimaryClassName()} block w-full rounded-2xl py-4 text-center text-base font-bold`}
          >
            متابعة الطلب
          </Link>
        </div>
      </div>
    </>
  );
}
