"use client";

import Link from "next/link";
import { useCart, estimateCartTotal } from "@/contexts/cart-context";
import { formatPrice } from "@/lib/money";
import type { PublicMenu } from "@/lib/menu/public-menu";

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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-lg">
        <Link
          href={cartHref}
          className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl bg-amber-600 px-5 py-3.5 text-white shadow-lg shadow-amber-600/30 transition hover:bg-amber-700"
        >
          <span className="flex items-center gap-2">
            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white/25 px-2 text-sm font-bold">
              {itemCount}
            </span>
            <span className="font-semibold">عرض السلة</span>
          </span>
          <span className="font-bold tabular-nums">
            {formatPrice(total, menu.settings.currency_label)}
          </span>
        </Link>
      </div>
    </div>
  );
}
