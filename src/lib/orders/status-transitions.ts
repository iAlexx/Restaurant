import type { OrderStatus } from "@/types/database";

/** Restaurant local timezone — matches next_order_number() and daily reports. */
export const RESTAURANT_TIMEZONE = "Asia/Damascus";

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["PREPARING", "CANCELLED"],
  WAITING_WHATSAPP_CONFIRMATION: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function isTerminalStatus(status: OrderStatus): boolean {
  return status === "COMPLETED" || status === "CANCELLED";
}

export function getAllowedNextStatuses(status: OrderStatus): OrderStatus[] {
  return ALLOWED_TRANSITIONS[status] ?? [];
}

export function isValidStatusTransition(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  if (from === to) return false;
  return getAllowedNextStatuses(from).includes(to);
}

export function canCancelOrder(status: OrderStatus): boolean {
  return !isTerminalStatus(status);
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "جديد",
  WAITING_WHATSAPP_CONFIRMATION: "بانتظار تأكيد واتساب",
  CONFIRMED: "مؤكد",
  PREPARING: "قيد التحضير",
  READY: "جاهز",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغى",
};

export const ORDER_TYPE_LABELS: Record<
  import("@/types/database").OrderType,
  string
> = {
  DINE_IN: "داخل المطعم",
  DELIVERY: "توصيل",
  PICKUP: "استلام",
};

export const PRINT_STATUS_LABELS: Record<
  import("@/types/database").PrintJobStatus,
  string
> = {
  PENDING: "بانتظار الطباعة",
  PRINTING: "جاري الطباعة",
  PRINTED: "مطبوع",
  FAILED: "فشل الطباعة",
};
