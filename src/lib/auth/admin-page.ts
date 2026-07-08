import { redirect } from "next/navigation";
import { requireAdminSession, type StaffSession } from "@/lib/auth/session";

export async function requireAdminPage(): Promise<StaffSession> {
  try {
    return await requireAdminSession();
  } catch {
    redirect("/dashboard/orders");
  }
}
