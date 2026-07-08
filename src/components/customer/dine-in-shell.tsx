"use client";

import Link from "next/link";
import { CartProvider, useCart } from "@/contexts/cart-context";
import { CustomerHeader } from "@/components/customer/customer-header";
import { MenuView } from "@/components/customer/menu-view";
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
      <main className="mx-auto max-w-lg px-4 py-4">
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          طاولة: <strong>{tableLabel}</strong>
        </p>
        <MenuView menu={menu} />
      </main>
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
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-stone-900">طاولة غير متاحة</h1>
        <p className="mt-3 text-stone-600">
          رمز QR غير صالح أو أن هذه الطاولة موقوفة حالياً. يرجى التواصل مع موظف
          المطعم.
        </p>
        <Link href="/" className="mt-6 inline-block text-amber-700 underline">
          الصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
