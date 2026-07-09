"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CartProvider, useCart } from "@/contexts/cart-context";
import { CustomerHeader } from "@/components/customer/customer-header";
import { MenuView } from "@/components/customer/menu-view";
import { CartView } from "@/components/customer/cart-view";
import { CheckoutClient } from "@/components/customer/checkout-client";
import { StickyCartBar } from "@/components/customer/sticky-cart-bar";
import { EmptyState } from "@/components/dashboard/form-ui";
import type { PublicMenu } from "@/lib/menu/public-menu";

type ExternalOrderType = "DELIVERY" | "PICKUP";

function TypePicker({ menu }: { menu: PublicMenu }) {
  const router = useRouter();
  const canDeliver = menu.settings.delivery_enabled;
  const canPickup = menu.settings.pickup_enabled;

  return (
    <div className="min-h-screen bg-brand-cream">
      <header className="motion-fade-up border-b border-brand-gold/40 bg-brand-surface px-4 py-8 text-center">
        {menu.settings.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={menu.settings.logo_url}
            alt=""
            className="motion-scale-in mx-auto mb-3 h-16 w-16 rounded-full object-cover ring-2 ring-brand-gold/50"
          />
        ) : null}
        <h1 className="text-2xl font-extrabold text-brand-chocolate">
          {menu.settings.name}
        </h1>
        {menu.settings.opening_hours ? (
          <p className="mt-1 text-sm text-brand-muted">
            {menu.settings.opening_hours}
          </p>
        ) : null}
      </header>
      <main className="mx-auto max-w-lg space-y-3 px-4 py-8">
        {canDeliver || canPickup ? (
          <p className="motion-fade-up motion-stagger-1 mb-2 text-center font-semibold text-brand-chocolate">
            اختر نوع الطلب
          </p>
        ) : null}
        {canDeliver ? (
          <button
            type="button"
            onClick={() => router.push("/order?type=DELIVERY")}
            className="motion-fade-up motion-stagger-2 flex w-full min-h-[44px] items-center gap-4 rounded-2xl border border-brand-border bg-brand-surface p-4 text-start shadow-sm transition hover:border-brand-gold/60 hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange-soft text-2xl">
              🛵
            </span>
            <span>
              <span className="block text-lg font-bold text-brand-chocolate">
                توصيل
              </span>
              <span className="text-sm text-brand-muted">
                استلم طلبك على عنوانك
              </span>
            </span>
          </button>
        ) : null}
        {canPickup ? (
          <button
            type="button"
            onClick={() => router.push("/order?type=PICKUP")}
            className="motion-fade-up motion-stagger-3 flex w-full min-h-[44px] items-center gap-4 rounded-2xl border border-brand-border bg-brand-surface p-4 text-start shadow-sm transition hover:border-brand-gold/60 hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold-soft text-2xl">
              🏪
            </span>
            <span>
              <span className="block text-lg font-bold text-brand-chocolate">
                استلام من المطعم
              </span>
              <span className="text-sm text-brand-muted">
                جهّز طلبك واستلمه بنفسك
              </span>
            </span>
          </button>
        ) : null}
        {!canDeliver && !canPickup ? (
          <EmptyState
            title="الطلب الخارجي غير متاح حالياً"
            description="خدمة التوصيل والاستلام متوقفة مؤقتاً. يرجى المحاولة لاحقاً."
          />
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
    <div className="min-h-screen bg-brand-cream">
      <CustomerHeader
        settings={menu.settings}
        cartHref={`/order/cart?type=${orderType}`}
        itemCount={itemCount}
      />
      <main className="mx-auto max-w-lg px-4 py-3">
        <div className="flex items-center justify-between rounded-xl border border-brand-gold/45 bg-brand-gold-soft px-4 py-2.5 text-sm">
          <p className="font-semibold text-brand-chocolate">
            {orderType === "DELIVERY" ? "🛵 توصيل" : "🏪 استلام من المطعم"}
          </p>
          <Link
            href="/order"
            className="font-medium text-brand-orange underline"
          >
            تغيير
          </Link>
        </div>
        <MenuView menu={menu} />
      </main>
      <StickyCartBar menu={menu} cartHref={`/order/cart?type=${orderType}`} />
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
    <div className="min-h-screen bg-brand-cream">
      <CustomerHeader
        settings={menu.settings}
        cartHref={`/order/cart?type=${orderType}`}
        itemCount={itemCount}
      />
      <main className="mx-auto max-w-lg px-4 py-4">
        <h1 className="mb-4 text-xl font-bold text-brand-chocolate">السلة</h1>
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
    <div className="min-h-screen bg-brand-cream">
      <CustomerHeader
        settings={menu.settings}
        cartHref={`/order/cart?type=${orderType}`}
        itemCount={itemCount}
      />
      <main className="mx-auto max-w-lg px-4 py-4">
        <h1 className="mb-4 text-xl font-bold text-brand-chocolate">
          تأكيد الطلب
        </h1>
        <CheckoutClient
          menu={menu}
          orderType={orderType}
          successBasePath="/order/success"
        />
        <Link
          href={`/order/cart?type=${orderType}`}
          className="mt-4 block text-center text-sm text-brand-muted underline hover:text-brand-chocolate"
        >
          العودة إلى السلة
        </Link>
      </main>
    </div>
  );
}
