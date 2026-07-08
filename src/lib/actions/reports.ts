"use server";

import { requireStaffSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { computeDailyReport } from "@/lib/orders/dashboard";
import { RESTAURANT_TIMEZONE } from "@/lib/orders/status-transitions";
import {
  getRestaurantDayUtcBounds,
  getRestaurantLocalDateString,
} from "@/lib/time/restaurant-date";
import type { Order } from "@/types/database";

export async function getDailyReportForStaff() {
  await requireStaffSession();

  const date = getRestaurantLocalDateString();
  const { start, end } = getRestaurantDayUtcBounds(date);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("order_type, status, total, created_at")
    .gte("created_at", start)
    .lte("created_at", end);

  if (error) {
    throw new Error("تعذر تحميل التقرير اليومي");
  }

  return computeDailyReport(
    (data ?? []) as Pick<Order, "order_type" | "status" | "total">[],
    date,
    RESTAURANT_TIMEZONE
  );
}
