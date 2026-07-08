import type { UserRole } from "@/types/database";

export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}

export function isCashier(role: UserRole): boolean {
  return role === "CASHIER";
}
