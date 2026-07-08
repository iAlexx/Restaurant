"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface DashboardNavItem {
  href: string;
  label: string;
}

const icons: Record<string, string> = {
  "/dashboard/orders": "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",
  "/dashboard/categories": "M4 6h16M4 12h16M4 18h16",
  "/dashboard/products": "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  "/dashboard/add-ons": "M12 5v14M5 12h14",
  "/dashboard/tables": "M3 10h18M3 10l2-6h14l2 6M3 10v10h18V10",
  "/dashboard/reports": "M9 17V9m4 8V5m4 12v-4M4 21h16",
  "/dashboard/settings":
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
};

function Icon({ href }: { href: string }) {
  const d = icons[href] ?? icons["/dashboard/orders"];
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {href === "/dashboard/settings" ? (
        <>
          <path d={d} />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <path d={d} />
      )}
    </svg>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSidebarNav({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-stone-600 hover:bg-white hover:text-amber-700"
              }`}
            >
              <Icon href={item.href} />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function DashboardBottomNav({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="no-scrollbar flex overflow-x-auto">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="min-w-0 flex-1 shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-[72px] flex-col items-center gap-1 px-3 py-2 text-[11px] font-medium transition ${
                  active ? "text-amber-700" : "text-stone-500"
                }`}
              >
                <Icon href={item.href} />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
