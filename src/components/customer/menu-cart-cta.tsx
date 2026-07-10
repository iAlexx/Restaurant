"use client";

import Link from "next/link";
import { useCart } from "@/contexts/cart-context";
import { customerContainerClassName } from "@/components/customer/customer-menu-shell";

interface MenuCartCtaProps {
  cartHref: string;
  onAddMore: () => void;
}

export function MenuCartCta({ cartHref, onAddMore }: MenuCartCtaProps) {
  const { itemCount, hydrated } = useCart();

  if (!hydrated || itemCount === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className={customerContainerClassName}>
        <div className="pointer-events-auto rounded-2xl border border-brand-gold/40 bg-brand-surface p-4 shadow-lg shadow-brand-chocolate/10">
          <p className="mb-3 text-center text-base font-extrabold text-brand-chocolate">
            هل انتهيت من طلباتك؟
          </p>
          <div className="flex flex-col gap-2.5 sm:flex-row-reverse sm:gap-3">
            <Link
              href={cartHref}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-brand-orange px-4 text-sm font-bold text-white transition hover:bg-brand-orange-hover active:scale-[0.99]"
            >
              متابعة الطلب
            </Link>
            <button
              type="button"
              onClick={onAddMore}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-brand-gold/50 bg-brand-cream px-4 text-sm font-bold text-brand-chocolate transition hover:border-brand-gold hover:bg-brand-gold-soft/40 active:scale-[0.99]"
            >
              إضافة المزيد
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
