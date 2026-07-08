import Link from "next/link";
import { logoutAction } from "@/app/login/actions";
import { getStaffSession, isAdmin } from "@/lib/auth/session";
import type { UserRole } from "@/types/database";

const navItems: { href: string; label: string; roles: UserRole[] }[] = [
  { href: "/dashboard/orders", label: "الطلبات", roles: ["ADMIN", "CASHIER"] },
  { href: "/dashboard/categories", label: "الأقسام", roles: ["ADMIN"] },
  { href: "/dashboard/products", label: "المنتجات", roles: ["ADMIN"] },
  { href: "/dashboard/add-ons", label: "الإضافات", roles: ["ADMIN"] },
  { href: "/dashboard/tables", label: "الطاولات", roles: ["ADMIN"] },
  { href: "/dashboard/reports", label: "التقرير اليومي", roles: ["ADMIN", "CASHIER"] },
  { href: "/dashboard/settings", label: "الإعدادات", roles: ["ADMIN"] },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getStaffSession();

  if (!session) {
    return null;
  }

  const visibleNav = navItems.filter((item) =>
    item.roles.includes(session.profile.role)
  );

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-lg font-bold text-stone-900">لوحة المطعم</p>
            <p className="text-sm text-stone-500">
              {session.profile.display_name} —{" "}
              {isAdmin(session.profile.role) ? "مدير" : "كاشير"}
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
            >
              خروج
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <nav className="hidden w-48 shrink-0 md:block">
          <ul className="space-y-1">
            {visibleNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-white hover:text-amber-700"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 flex-1 rounded-2xl bg-white p-6 shadow-sm">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white md:hidden">
        <ul className="flex overflow-x-auto">
          {visibleNav.map((item) => (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                className="block px-4 py-3 text-xs text-stone-700"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
