"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CartProvider, useCart } from "@/contexts/cart-context";
import { CustomerHeader } from "@/components/customer/customer-header";
import { MenuView } from "@/components/customer/menu-view";
import { CartView } from "@/components/customer/cart-view";
import { CheckoutClient } from "@/components/customer/checkout-client";
import { StickyCartBar } from "@/components/customer/sticky-cart-bar";
import { TableContextStrip } from "@/components/customer/table-context-strip";
import { CustomerPageShell } from "@/components/customer/customer-menu-shell";
import { EmptyState } from "@/components/dashboard/form-ui";
import type { PublicMenu } from "@/lib/menu/public-menu";

type ExternalOrderType = "DELIVERY" | "PICKUP";

function TypePicker({ menu }: { menu: PublicMenu }) {
  const router = useRouter();
  const canDeliver = menu.settings.delivery_enabled;
  const canPickup = menu.settings.pickup_enabled;

  return (
    <CustomerPageShell
      header={
        <CustomerHeader settings={menu.settings} showCart={false} itemCount={0} />
      }
      pageTitle="طلب خارجي"
      pageSubtitle={
        menu.settings.opening_hours ?? "اختر نوع الطلب للمتابعة"
      }
    >
      {canDeliver || canPickup ? (
        <p className="mb-4 text-center text-base font-bold text-brand-chocolate">
          اختر نوع الطلب
        </p>
      ) : null}
      <div className="mx-auto grid max-w-2xl gap-4">
        {canDeliver ? (
          <button
            type="button"
            onClick={() => router.push("/order?type=DELIVERY")}
            className="motion-fade-up motion-stagger-1 flex w-full min-h-[72px] items-center gap-4 rounded-2xl border border-brand-gold/40 bg-brand-surface p-5 text-start shadow-sm transition hover:-translate-y-0.5 hover:border-brand-gold hover:shadow-md"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-orange-soft text-2xl">
              🛵
            </span>
            <span>
              <span className="block text-lg font-extrabold text-brand-chocolate">
                توصيل
              </span>
              <span className="text-sm leading-relaxed text-brand-muted">
                استلم طلبك على عنوانك
              </span>
            </span>
          </button>
        ) : null}
        {canPickup ? (
          <button
            type="button"
            onClick={() => router.push("/order?type=PICKUP")}
            className="motion-fade-up motion-stagger-2 flex w-full min-h-[72px] items-center gap-4 rounded-2xl border border-brand-gold/40 bg-brand-surface p-5 text-start shadow-sm transition hover:-translate-y-0.5 hover:border-brand-gold hover:shadow-md"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-gold-soft text-2xl">
              🏪
            </span>
            <span>
              <span className="block text-lg font-extrabold text-brand-chocolate">
                استلام من المطعم
              </span>
              <span className="text-sm leading-relaxed text-brand-muted">
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
      </div>
    </CustomerPageShell>
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
  const cartHref = `/order/cart?type=${orderType}`;

  return (
    <CustomerPageShell
      header={
        <CustomerHeader
          settings={menu.settings}
          cartHref={cartHref}
          itemCount={itemCount}
        />
      }
      contextStrip={
        <TableContextStrip
          label={
            orderType === "DELIVERY"
              ? "🛵 أنت تطلب توصيلاً"
              : "🏪 أنت تطلب استلاماً من المطعم"
          }
          action={
            <Link
              href="/order"
              className="text-sm font-bold text-brand-orange underline-offset-2 hover:underline"
            >
              تغيير
            </Link>
          }
        />
      }
      bottomBar={<StickyCartBar menu={menu} cartHref={cartHref} />}
    >
      <MenuView menu={menu} />
    </CustomerPageShell>
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
    <CustomerPageShell
      header={
        <CustomerHeader
          settings={menu.settings}
          cartHref={`/order/cart?type=${orderType}`}
          itemCount={itemCount}
        />
      }
      pageTitle="السلة"
    >
      <CartView
        menu={menu}
        checkoutHref={`/order/checkout?type=${orderType}`}
        backHref={`/order?type=${orderType}`}
      />
    </CustomerPageShell>
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
    <CustomerPageShell
      header={
        <CustomerHeader
          settings={menu.settings}
          cartHref={`/order/cart?type=${orderType}`}
          itemCount={itemCount}
        />
      }
      pageTitle="تأكيد الطلب"
    >
      <CheckoutClient
        menu={menu}
        orderType={orderType}
        successBasePath="/order/success"
        emptyCartHref={`/order/cart?type=${orderType}`}
      />
      <Link
        href={`/order/cart?type=${orderType}`}
        className="mt-6 block text-center text-sm font-medium text-brand-muted underline-offset-2 hover:text-brand-chocolate hover:underline"
      >
        العودة إلى السلة
      </Link>
    </CustomerPageShell>
  );
}
