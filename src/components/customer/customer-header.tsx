import Link from "next/link";
import type { PublicRestaurantSettings } from "@/lib/menu/public-menu";

export function CustomerHeader({
  settings,
  cartHref,
  itemCount,
  tableLabel,
}: {
  settings: PublicRestaurantSettings;
  cartHref: string;
  itemCount: number;
  tableLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-brand-gold/40 bg-brand-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          {settings.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logo_url}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-brand-gold/50"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange-soft text-lg">
              🍽
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-brand-chocolate">
              {settings.name}
            </h1>
            {tableLabel ? (
              <p className="truncate text-xs font-semibold text-brand-orange">
                <span className="me-1 inline-block h-1.5 w-1.5 rounded-full bg-brand-gold" />
                طاولة {tableLabel}
              </p>
            ) : settings.opening_hours ? (
              <p className="truncate text-xs text-brand-muted">
                {settings.opening_hours}
              </p>
            ) : null}
          </div>
        </div>
        <Link
          href={cartHref}
          aria-label="السلة"
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-brand-orange text-white transition hover:bg-brand-orange-hover"
        >
          <svg
            width="20"
            height="20"
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
          {itemCount > 0 ? (
            <span className="absolute -top-1 start-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-chocolate px-1 text-xs font-bold text-white">
              {itemCount}
            </span>
          ) : null}
        </Link>
      </div>
      <div className="h-0.5 bg-brand-orange" aria-hidden="true" />
    </header>
  );
}
