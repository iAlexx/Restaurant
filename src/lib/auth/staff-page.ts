import { redirect } from "next/navigation";
import { requireStaffSession } from "@/lib/auth/session";
import { canRoleAccessDashboardPath } from "@/lib/auth/permissions";

export async function requireStaffPage(pathname: string) {
  const session = await requireStaffSession().catch(() => null);

  if (!session) {
    redirect("/login");
  }

  if (!canRoleAccessDashboardPath(session.profile.role, pathname)) {
    redirect("/dashboard/orders");
  }

  return session;
}
