import Link from "next/link";
import type { PublicRestaurantSettings } from "@/lib/menu/public-menu";
import { customerContainerClassName } from "@/components/customer/customer-menu-shell";
import { RestaurantLogo } from "@/components/customer/restaurant-logo";

export function CustomerHeader({
  settings,
  cartHref,
  itemCount = 0,
  showCart = true,
}: {
  settings: PublicRestaurantSettings;
  cartHref?: string;
  itemCount?: number;
  /** Hide cart button (e.g. table picker). */
  showCart?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 bg-brand-surface shadow-sm">
      <div
        className={`${customerContainerClassName} flex min-h-[60px] items-center justify-between gap-3 py-2.5`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <RestaurantLogo
            logoUrl={settings.logo_url}
            variant="header"
            priority={false}
          />
          <h1 className="min-w-0 truncate text-base font-extrabold text-brand-chocolate sm:text-lg">
            {settings.name}
          </h1>
        </div>

        {showCart && cartHref ? (
          <Link
            href={cartHref}
            aria-label={`السلة${itemCount > 0 ? `، ${itemCount} أصناف` : ""}`}
            className="relative flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-brand-orange px-3.5 py-2 text-sm font-bold text-white transition hover:bg-brand-orange-hover focus:outline-none focus:ring-2 focus:ring-brand-orange/40 sm:px-4"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="hidden sm:inline">السلة</span>
            {itemCount > 0 ? (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-chocolate px-1.5 text-xs font-bold">
                {itemCount}
              </span>
            ) : null}
          </Link>
        ) : null}
      </div>
      <div className="h-0.5 bg-brand-orange" aria-hidden="true" />
    </header>
  );
}
