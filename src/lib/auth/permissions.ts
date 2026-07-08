import type { UserRole } from "@/types/database";

const ADMIN_ONLY_PREFIXES = [
  "/dashboard/categories",
  "/dashboard/products",
  "/dashboard/add-ons",
  "/dashboard/tables",
  "/dashboard/settings",
];

const STAFF_PREFIXES = [
  "/dashboard/orders",
  "/dashboard/reports",
];

export function isAdminOnlyDashboardPath(pathname: string): boolean {
  return ADMIN_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isStaffDashboardPath(pathname: string): boolean {
  return STAFF_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function canRoleAccessDashboardPath(
  role: UserRole,
  pathname: string
): boolean {
  if (role === "ADMIN") return true;
  if (role !== "CASHIER") return false;
  if (isAdminOnlyDashboardPath(pathname)) return false;
  return isStaffDashboardPath(pathname) || pathname === "/dashboard";
}
