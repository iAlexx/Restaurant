"use client";

import Link from "next/link";
import { CartProvider, useCart } from "@/contexts/cart-context";
import { CustomerHeader } from "@/components/customer/customer-header";
import { MenuView } from "@/components/customer/menu-view";
import { StickyCartBar } from "@/components/customer/sticky-cart-bar";
import type { PublicMenu } from "@/lib/menu/public-menu";

function DineInMenuInner({
  menu,
  tableToken,
  tableLabel,
}: {
  menu: PublicMenu;
  tableToken: string;
  tableLabel: string;
}) {
  const { itemCount } = useCart();

  return (
    <div className="min-h-screen bg-stone-50">
      <CustomerHeader
        settings={menu.settings}
        cartHref={`/t/${tableToken}/cart`}
        itemCount={itemCount}
      />
      <main className="mx-auto max-w-lg px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          <span>🍽</span>
          <span>
            طاولة <strong>{tableLabel}</strong> — تصفّح القائمة وأرسل طلبك
          </span>
        </div>
        <MenuView menu={menu} />
      </main>
      <StickyCartBar menu={menu} cartHref={`/t/${tableToken}/cart`} />
    </div>
  );
}

export function DineInMenuClient({
  menu,
  tableToken,
  tableLabel,
}: {
  menu: PublicMenu;
  tableToken: string;
  tableLabel: string;
}) {
  return (
    <CartProvider mode="dine_in" tableToken={tableToken}>
      <DineInMenuInner menu={menu} tableToken={tableToken} tableLabel={tableLabel} />
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
          المطعم أو مسح الرمز الصحيح على طاولتك.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
        >
          الصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
