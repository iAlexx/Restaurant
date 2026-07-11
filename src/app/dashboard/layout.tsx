import { logoutAction } from "@/app/login/actions";
import { getStaffSession, isAdmin } from "@/lib/auth/session";
import {
  DashboardBottomNav,
  DashboardSidebarNav,
} from "@/components/dashboard/dashboard-nav";
import { Badge } from "@/components/dashboard/form-ui";
import type { UserRole } from "@/types/database";

const navItems: { href: string; label: string; roles: UserRole[] }[] = [
  { href: "/dashboard/orders", label: "الطلبات", roles: ["ADMIN", "CASHIER"] },
  { href: "/dashboard/categories", label: "الأقسام", roles: ["ADMIN"] },
  { href: "/dashboard/products", label: "المنتجات", roles: ["ADMIN"] },
  { href: "/dashboard/add-ons", label: "الإضافات", roles: ["ADMIN"] },
  { href: "/dashboard/tables", label: "الطاولات", roles: ["ADMIN"] },
  { href: "/dashboard/charges", label: "الضرائب والرسوم", roles: ["ADMIN"] },
  {
    href: "/dashboard/reports",
    label: "التقرير اليومي",
    roles: ["ADMIN", "CASHIER"],
  },
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

  const admin = isAdmin(session.profile.role);
  const visibleNav = navItems
    .filter((item) => item.roles.includes(session.profile.role))
    .map(({ href, label }) => ({ href, label }));

  return (
    <div className="min-h-screen bg-brand-cream">
      <header className="sticky top-0 z-30 border-b border-brand-gold/40 bg-brand-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-orange text-lg text-white">
              🍽
            </div>
            <div>
              <p className="text-base font-bold leading-tight text-brand-chocolate">
                لوحة المطعم
              </p>
              <p className="flex items-center gap-1.5 text-xs text-brand-muted">
                {session.profile.display_name}
                <Badge tone={admin ? "orange" : "gold"}>
                  {admin ? "مدير" : "كاشير"}
                </Badge>
              </p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="min-h-[44px] rounded-lg border border-brand-border px-3 py-1.5 text-sm font-medium text-brand-chocolate hover:bg-brand-gold-soft"
            >
              خروج
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <aside className="hidden w-52 shrink-0 md:block">
          <div className="sticky top-20">
            <DashboardSidebarNav items={visibleNav} />
          </div>
        </aside>

        <main className="min-w-0 flex-1 rounded-2xl border border-brand-border bg-brand-surface p-4 pb-24 shadow-sm sm:p-6 md:pb-6">
          {children}
        </main>
      </div>

      <DashboardBottomNav items={visibleNav} />
    </div>
  );
}
