"use client";

import Link from "next/link";
import { CartProvider, useCart } from "@/contexts/cart-context";
import { CustomerHeader } from "@/components/customer/customer-header";
import { MenuView } from "@/components/customer/menu-view";
import { StickyCartBar } from "@/components/customer/sticky-cart-bar";
import { DineInTableBanner } from "@/components/customer/dine-in-table-banner";
import { DineInTableCacheSync } from "@/components/customer/dine-in-table-cache-sync";
import type { PublicMenu } from "@/lib/menu/public-menu";
import {
  type DineInContext,
  dineInCartHref,
} from "@/lib/dine-in/paths";

function DineInMenuInner({
  menu,
  ctx,
}: {
  menu: PublicMenu;
  ctx: DineInContext;
}) {
  const { itemCount } = useCart();
  const cartHref = dineInCartHref(ctx);

  return (
    <div className="min-h-screen bg-stone-50">
      <DineInTableCacheSync
        tableToken={ctx.tableToken}
        tableLabel={ctx.tableLabel}
      />
      <CustomerHeader
        settings={menu.settings}
        cartHref={cartHref}
        itemCount={itemCount}
        tableLabel={ctx.tableLabel}
      />
      <main className="mx-auto max-w-lg px-4 py-3">
        <div className="mb-3">
          <DineInTableBanner ctx={ctx} />
        </div>
        <p className="mb-3 text-sm text-stone-600">
          تصفّح القائمة وأرسل طلبك
        </p>
        <MenuView menu={menu} />
      </main>
      <StickyCartBar menu={menu} cartHref={cartHref} />
    </div>
  );
}

export function DineInMenuClient({
  menu,
  ctx,
}: {
  menu: PublicMenu;
  ctx: DineInContext;
}) {
  return (
    <CartProvider mode="dine_in" tableToken={ctx.tableToken}>
      <DineInMenuInner menu={menu} ctx={ctx} />
    </CartProvider>
  );
}

export function InvalidTablePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
          ⚠️
        </div>
        <h1 className="text-xl font-bold text-stone-900">طاولة غير متاحة</h1>
        <p className="mt-3 leading-relaxed text-stone-600">
          رمز QR غير صالح أو أن هذه الطاولة موقوفة حالياً. يرجى التواصل مع موظف
          المطعم أو اختيار طاولة أخرى.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/dine-in"
            className="inline-flex justify-center rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
          >
            اختيار طاولة
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-stone-500 hover:text-stone-800"
          >
            الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
