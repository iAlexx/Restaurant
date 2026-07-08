import Link from "next/link";
import type { PublicRestaurantSettings } from "@/lib/menu/public-menu";

export function CustomerHeader({
  settings,
  cartHref,
  itemCount,
}: {
  settings: PublicRestaurantSettings;
  cartHref: string;
  itemCount: number;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {settings.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logo_url}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-stone-900">
              {settings.name}
            </h1>
            {settings.opening_hours ? (
              <p className="truncate text-xs text-stone-500">
                {settings.opening_hours}
              </p>
            ) : null}
          </div>
        </div>
        <Link
          href={cartHref}
          className="relative rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white"
        >
          السلة
          {itemCount > 0 ? (
            <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-xs text-white">
              {itemCount}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}
