"use client";

import Link from "next/link";
import { CartProvider, useCart } from "@/contexts/cart-context";
import { CustomerHeader } from "@/components/customer/customer-header";
import { CartView } from "@/components/customer/cart-view";
import { CheckoutClient } from "@/components/customer/checkout-client";
import type { PublicMenu } from "@/lib/menu/public-menu";

function DineInCartInner({
  menu,
  tableToken,
}: {
  menu: PublicMenu;
  tableToken: string;
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
        <h1 className="mb-4 text-xl font-bold">السلة</h1>
        <CartView
          menu={menu}
          checkoutHref={`/t/${tableToken}/checkout`}
          backHref={`/t/${tableToken}`}
        />
      </main>
    </div>
  );
}

export function DineInCartClient({
  menu,
  tableToken,
}: {
  menu: PublicMenu;
  tableToken: string;
}) {
  return (
    <CartProvider mode="dine_in" tableToken={tableToken}>
      <DineInCartInner menu={menu} tableToken={tableToken} />
    </CartProvider>
  );
}

function DineInCheckoutInner({
  menu,
  tableToken,
}: {
  menu: PublicMenu;
  tableToken: string;
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
        <h1 className="mb-4 text-xl font-bold">تأكيد الطلب</h1>
        <CheckoutClient
          menu={menu}
          orderType="DINE_IN"
          tableToken={tableToken}
          successBasePath={`/t/${tableToken}/success`}
        />
        <Link
          href={`/t/${tableToken}/cart`}
          className="mt-4 block text-center text-sm text-stone-500 underline"
        >
          العودة إلى السلة
        </Link>
      </main>
    </div>
  );
}

export function DineInCheckoutClient({
  menu,
  tableToken,
}: {
  menu: PublicMenu;
  tableToken: string;
}) {
  return (
    <CartProvider mode="dine_in" tableToken={tableToken}>
      <DineInCheckoutInner menu={menu} tableToken={tableToken} />
    </CartProvider>
  );
}
