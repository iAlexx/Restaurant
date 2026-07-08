"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CartProvider, useCart } from "@/contexts/cart-context";
import { CustomerHeader } from "@/components/customer/customer-header";
import { MenuView } from "@/components/customer/menu-view";
import { CartView } from "@/components/customer/cart-view";
import { CheckoutClient } from "@/components/customer/checkout-client";
import type { PublicMenu } from "@/lib/menu/public-menu";

type ExternalOrderType = "DELIVERY" | "PICKUP";

function TypePicker({ menu }: { menu: PublicMenu }) {
  const router = useRouter();
  const canDeliver = menu.settings.delivery_enabled;
  const canPickup = menu.settings.pickup_enabled;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-4 py-6 text-center">
        <h1 className="text-xl font-bold text-stone-900">{menu.settings.name}</h1>
      </header>
      <main className="mx-auto max-w-lg space-y-3 px-4 py-8">
        <p className="mb-4 text-center text-stone-600">اختر نوع الطلب</p>
        {canDeliver ? (
          <button
            type="button"
            onClick={() => router.push("/order?type=DELIVERY")}
            className="w-full rounded-xl border border-stone-200 bg-white py-4 text-lg font-medium shadow-sm hover:border-amber-400"
          >
            توصيل
          </button>
        ) : null}
        {canPickup ? (
          <button
            type="button"
            onClick={() => router.push("/order?type=PICKUP")}
            className="w-full rounded-xl border border-stone-200 bg-white py-4 text-lg font-medium shadow-sm hover:border-amber-400"
          >
            استلام من المطعم
          </button>
        ) : null}
        {!canDeliver && !canPickup ? (
          <p className="text-center text-stone-500">الطلب الخارجي غير متاح حالياً</p>
        ) : null}
      </main>
    </div>
  );
}

function ExternalMenuInner({
  menu,
  orderType,
}: {
  menu: PublicMenu;
  orderType: ExternalOrderType;
}) {
  const { itemCount } = useCart();

  return (
    <div className="min-h-screen bg-stone-50">
      <CustomerHeader
        settings={menu.settings}
        cartHref={`/order/cart?type=${orderType}`}
        itemCount={itemCount}
      />
      <main className="mx-auto max-w-lg px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-amber-800">
            {orderType === "DELIVERY" ? "توصيل" : "استلام من المطعم"}
          </p>
          <Link href="/order" className="text-sm text-stone-500 underline">
            تغيير
          </Link>
        </div>
        <MenuView menu={menu} />
      </main>
    </div>
  );
}

export function ExternalOrderPageClient({
  menu,
  orderType,
}: {
  menu: PublicMenu;
  orderType: ExternalOrderType | null;
}) {
  return (
    <CartProvider mode="external">
      {!orderType ? (
        <TypePicker menu={menu} />
      ) : (
        <ExternalMenuInner menu={menu} orderType={orderType} />
      )}
    </CartProvider>
  );
}

export function ExternalCartClient({
  menu,
  orderType,
}: {
  menu: PublicMenu;
  orderType: ExternalOrderType;
}) {
  return (
    <CartProvider mode="external">
      <ExternalCartInner menu={menu} orderType={orderType} />
    </CartProvider>
  );
}

function ExternalCartInner({
  menu,
  orderType,
}: {
  menu: PublicMenu;
  orderType: ExternalOrderType;
}) {
  const { itemCount } = useCart();

  return (
    <div className="min-h-screen bg-stone-50">
      <CustomerHeader
        settings={menu.settings}
        cartHref={`/order/cart?type=${orderType}`}
        itemCount={itemCount}
      />
      <main className="mx-auto max-w-lg px-4 py-4">
        <h1 className="mb-4 text-xl font-bold">السلة</h1>
        <CartView
          menu={menu}
          checkoutHref={`/order/checkout?type=${orderType}`}
          backHref={`/order?type=${orderType}`}
        />
      </main>
    </div>
  );
}

export function ExternalCheckoutClient({
  menu,
  orderType,
}: {
  menu: PublicMenu;
  orderType: ExternalOrderType;
}) {
  return (
    <CartProvider mode="external">
      <ExternalCheckoutInner menu={menu} orderType={orderType} />
    </CartProvider>
  );
}

function ExternalCheckoutInner({
  menu,
  orderType,
}: {
  menu: PublicMenu;
  orderType: ExternalOrderType;
}) {
  const { itemCount } = useCart();

  return (
    <div className="min-h-screen bg-stone-50">
      <CustomerHeader
        settings={menu.settings}
        cartHref={`/order/cart?type=${orderType}`}
        itemCount={itemCount}
      />
      <main className="mx-auto max-w-lg px-4 py-4">
        <h1 className="mb-4 text-xl font-bold">تأكيد الطلب</h1>
        <CheckoutClient
          menu={menu}
          orderType={orderType}
          successBasePath="/order/success"
        />
        <Link
          href={`/order/cart?type=${orderType}`}
          className="mt-4 block text-center text-sm text-stone-500 underline"
        >
          العودة إلى السلة
        </Link>
      </main>
    </div>
  );
}
