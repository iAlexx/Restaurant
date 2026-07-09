"use client";

import Link from "next/link";
import { CartProvider, useCart } from "@/contexts/cart-context";
import { CustomerHeader } from "@/components/customer/customer-header";
import { CartView } from "@/components/customer/cart-view";
import { CheckoutClient } from "@/components/customer/checkout-client";
import { DineInTableBanner } from "@/components/customer/dine-in-table-banner";
import { DineInTableCacheSync } from "@/components/customer/dine-in-table-cache-sync";
import type { PublicMenu } from "@/lib/menu/public-menu";
import {
  type DineInContext,
  dineInCartHref,
  dineInCheckoutHref,
  dineInMenuHref,
  dineInSuccessPath,
} from "@/lib/dine-in/paths";

function DineInCartInner({
  menu,
  ctx,
}: {
  menu: PublicMenu;
  ctx: DineInContext;
}) {
  const { itemCount } = useCart();

  return (
    <div className="min-h-screen bg-brand-cream">
      <DineInTableCacheSync
        tableToken={ctx.tableToken}
        tableLabel={ctx.tableLabel}
      />
      <CustomerHeader
        settings={menu.settings}
        cartHref={dineInCartHref(ctx)}
        itemCount={itemCount}
        tableLabel={ctx.tableLabel}
      />
      <main className="mx-auto max-w-lg px-4 py-4">
        <div className="mb-4">
          <DineInTableBanner ctx={ctx} />
        </div>
        <h1 className="mb-4 text-xl font-bold">السلة</h1>
        <CartView
          menu={menu}
          checkoutHref={dineInCheckoutHref(ctx)}
          backHref={dineInMenuHref(ctx)}
          tableLabel={ctx.tableLabel}
        />
      </main>
    </div>
  );
}

export function DineInCartClient({
  menu,
  ctx,
}: {
  menu: PublicMenu;
  ctx: DineInContext;
}) {
  return (
    <CartProvider mode="dine_in" tableToken={ctx.tableToken}>
      <DineInCartInner menu={menu} ctx={ctx} />
    </CartProvider>
  );
}

function DineInCheckoutInner({
  menu,
  ctx,
}: {
  menu: PublicMenu;
  ctx: DineInContext;
}) {
  const { itemCount } = useCart();
  const successBasePath =
    ctx.flow === "unified"
      ? `/dine-in/success`
      : `/t/${ctx.tableToken}/success`;

  return (
    <div className="min-h-screen bg-brand-cream">
      <DineInTableCacheSync
        tableToken={ctx.tableToken}
        tableLabel={ctx.tableLabel}
      />
      <CustomerHeader
        settings={menu.settings}
        cartHref={dineInCartHref(ctx)}
        itemCount={itemCount}
        tableLabel={ctx.tableLabel}
      />
      <main className="mx-auto max-w-lg px-4 py-4">
        <div className="mb-4">
          <DineInTableBanner ctx={ctx} />
        </div>
        <h1 className="mb-4 text-xl font-bold">تأكيد الطلب</h1>
        <CheckoutClient
          menu={menu}
          orderType="DINE_IN"
          tableToken={ctx.tableToken}
          tableLabel={ctx.tableLabel}
          successBasePath={successBasePath}
          unifiedSuccessPath={
            ctx.flow === "unified"
              ? (orderId) => dineInSuccessPath(ctx, orderId)
              : undefined
          }
        />
        <Link
          href={dineInCartHref(ctx)}
          className="mt-4 block text-center text-sm text-brand-muted underline"
        >
          العودة إلى السلة
        </Link>
      </main>
    </div>
  );
}

export function DineInCheckoutClient({
  menu,
  ctx,
}: {
  menu: PublicMenu;
  ctx: DineInContext;
}) {
  return (
    <CartProvider mode="dine_in" tableToken={ctx.tableToken}>
      <DineInCheckoutInner menu={menu} ctx={ctx} />
    </CartProvider>
  );
}
