"use client";

import Link from "next/link";
import { useCart, estimateCartTotal } from "@/contexts/cart-context";
import { formatPrice } from "@/lib/money";
import type { PublicMenu } from "@/lib/menu/public-menu";
import { customerContainerClassName } from "@/components/customer/customer-menu-shell";

export function StickyCartBar({
  menu,
  cartHref,
}: {
  menu: PublicMenu;
  cartHref: string;
}) {
  const { cart, itemCount, hydrated } = useCart();

  if (!hydrated || itemCount === 0) return null;

  const total = estimateCartTotal(cart.lines, menu.products, menu.addOns);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className={customerContainerClassName}>
        <Link
          href={cartHref}
          className="pointer-events-auto flex min-h-[52px] items-center justify-between gap-4 rounded-2xl bg-brand-orange px-5 py-3.5 text-white shadow-lg shadow-brand-orange/30 transition hover:bg-brand-orange-hover active:scale-[0.99]"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-white/20 px-2 text-sm font-extrabold">
              {itemCount}
            </span>
            <span className="text-base font-bold">عرض السلة</span>
          </span>
          <span className="text-lg font-extrabold tabular-nums">
            {formatPrice(total, menu.settings.currency_label)}
          </span>
        </Link>
      </div>
    </div>
  );
}
