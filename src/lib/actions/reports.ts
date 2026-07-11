"use server";

import { requireStaffSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  computeDailyReport,
  computeOperationalSummary,
  type OrderExportRow,
} from "@/lib/orders/dashboard";
import { RESTAURANT_TIMEZONE } from "@/lib/orders/status-transitions";
import {
  getRestaurantDayUtcBounds,
  getRestaurantLocalDateString,
} from "@/lib/time/restaurant-date";
import type { Order } from "@/types/database";

async function fetchTodayOrdersForStaff() {
  const date = getRestaurantLocalDateString();
  const { start, end } = getRestaurantDayUtcBounds(date);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, order_type, status, subtotal, delivery_fee, total, created_at"
    )
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("تعذر تحميل بيانات اليوم");
  }

  return {
    date,
    orders: (data ?? []) as Pick<
      Order,
      | "id"
      | "order_type"
      | "status"
      | "subtotal"
      | "delivery_fee"
      | "total"
      | "order_number"
      | "created_at"
    >[],
  };
}

export async function getDailyReportForStaff() {
  await requireStaffSession();

  const { date, orders } = await fetchTodayOrdersForStaff();

  return computeDailyReport(
    orders,
    date,
    RESTAURANT_TIMEZONE
  );
}

export async function getOperationalSummaryForStaff() {
  await requireStaffSession();

  const date = getRestaurantLocalDateString();
  const { start, end } = getRestaurantDayUtcBounds(date);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("status, total")
    .gte("created_at", start)
    .lte("created_at", end);

  if (error) {
    throw new Error("تعذر تحميل ملخص الطلبات");
  }

  return computeOperationalSummary(
    (data ?? []) as Pick<Order, "status" | "total">[],
    date,
    RESTAURANT_TIMEZONE
  );
}

export async function getTodayOrdersExportForStaff(): Promise<OrderExportRow[]> {
  await requireStaffSession();
  const { orders } = await fetchTodayOrdersForStaff();
  if (orders.length === 0) return [];

  const supabase = await createClient();
  const orderIds = orders.map((order) => order.id);
  const { data: chargeRows } = await supabase
    .from("order_charges")
    .select("order_id, calculated_amount")
    .in("order_id", orderIds);

  const chargesByOrderId = new Map<string, number>();
  for (const row of chargeRows ?? []) {
    const record = row as { order_id: string; calculated_amount: number };
    const current = chargesByOrderId.get(record.order_id) ?? 0;
    chargesByOrderId.set(
      record.order_id,
      current + record.calculated_amount
    );
  }

  return orders.map((order) => ({
    order_number: order.order_number,
    order_type: order.order_type,
    status: order.status,
    subtotal: order.subtotal,
    delivery_fee: order.delivery_fee,
    charges_total: chargesByOrderId.get(order.id) ?? 0,
    total: order.total,
    created_at: order.created_at,
  }));
}
