import type { OrderStatus, OrderType, PrintJobStatus, Order } from "@/types/database";
import type { OrderListFilter } from "@/lib/validations/order-status";

export type { Order };

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  line_total: number;
  notes: string | null;
}

export interface OrderItemAddOn {
  id: string;
  order_item_id: string;
  add_on_id: string | null;
  name_snapshot: string;
  price_snapshot: number;
}

export interface OrderListRow {
  id: string;
  order_number: string;
  order_type: OrderType;
  status: OrderStatus;
  table_label_snapshot: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  total: number;
  created_at: string;
  latest_print_status: PrintJobStatus | null;
}

export interface DailyReportSummary {
  date: string;
  timezone: string;
  total_orders: number;
  total_value: number;
  dine_in_count: number;
  delivery_count: number;
  pickup_count: number;
  cancelled_count: number;
}

export interface OrdersOperationalSummary {
  date: string;
  timezone: string;
  total_orders: number;
  urgent_count: number;
  preparing_count: number;
  total_value: number;
}

export interface OrderExportRow {
  order_number: string;
  order_type: OrderType;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  charges_total: number;
  total: number;
  created_at: string;
}

export function filterOrdersByListFilter<T extends { status: OrderStatus; order_type: OrderType }>(
  orders: T[],
  filter: OrderListFilter
): T[] {
  if (filter === "all") return orders;

  const statusFilters: OrderStatus[] = [
    "NEW",
    "WAITING_WHATSAPP_CONFIRMATION",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "COMPLETED",
    "CANCELLED",
  ];

  if (statusFilters.includes(filter as OrderStatus)) {
    return orders.filter((o) => o.status === filter);
  }

  const typeFilters: OrderType[] = ["DINE_IN", "DELIVERY", "PICKUP"];
  if (typeFilters.includes(filter as OrderType)) {
    return orders.filter((o) => o.order_type === filter);
  }

  return orders;
}

export function computeDailyReport(
  orders: Pick<Order, "order_type" | "status" | "total">[],
  date: string,
  timezone: string
): DailyReportSummary {
  const active = orders.filter((o) => o.status !== "CANCELLED");

  return {
    date,
    timezone,
    total_orders: active.length,
    total_value: active.reduce((sum, o) => sum + o.total, 0),
    dine_in_count: active.filter((o) => o.order_type === "DINE_IN").length,
    delivery_count: active.filter((o) => o.order_type === "DELIVERY").length,
    pickup_count: active.filter((o) => o.order_type === "PICKUP").length,
    cancelled_count: orders.filter((o) => o.status === "CANCELLED").length,
  };
}

export function computeOperationalSummary(
  orders: Pick<Order, "status" | "total">[],
  date: string,
  timezone: string
): OrdersOperationalSummary {
  const active = orders.filter((o) => o.status !== "CANCELLED");
  const urgentStatuses: OrderStatus[] = [
    "NEW",
    "WAITING_WHATSAPP_CONFIRMATION",
  ];

  return {
    date,
    timezone,
    total_orders: active.length,
    urgent_count: orders.filter((o) => urgentStatuses.includes(o.status))
      .length,
    preparing_count: orders.filter((o) => o.status === "PREPARING").length,
    total_value: active.reduce((sum, o) => sum + o.total, 0),
  };
}

export function pickLatestPrintStatus(
  jobs: { status: PrintJobStatus; created_at: string }[]
): PrintJobStatus | null {
  if (jobs.length === 0) return null;
  const sorted = [...jobs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return sorted[0]?.status ?? null;
}
