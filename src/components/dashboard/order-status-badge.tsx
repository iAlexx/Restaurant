import type {
  OrderStatus,
  OrderType,
  PrintJobStatus,
} from "@/types/database";
import {
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PRINT_STATUS_LABELS,
} from "@/lib/orders/status-transitions";
import { Badge, type BadgeTone } from "@/components/dashboard/form-ui";

const statusTones: Record<OrderStatus, BadgeTone> = {
  NEW: "urgent",
  WAITING_WHATSAPP_CONFIRMATION: "urgent",
  CONFIRMED: "gold",
  PREPARING: "preparing",
  READY: "green",
  COMPLETED: "green",
  CANCELLED: "red",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={statusTones[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}

const typeTones: Record<OrderType, BadgeTone> = {
  DINE_IN: "dine_in",
  DELIVERY: "delivery",
  PICKUP: "pickup",
};

const typeIcons: Record<OrderType, string> = {
  DINE_IN: "🍽",
  DELIVERY: "🛵",
  PICKUP: "🏪",
};

export function OrderTypeBadge({ type }: { type: OrderType }) {
  return (
    <Badge tone={typeTones[type]}>
      <span className="me-1">{typeIcons[type]}</span>
      {ORDER_TYPE_LABELS[type]}
    </Badge>
  );
}

const printTones: Record<PrintJobStatus, BadgeTone> = {
  PENDING: "print_pending",
  PRINTING: "gold",
  PRINTED: "print_ok",
  FAILED: "print_fail",
};

export function PrintStatusBadge({
  status,
}: {
  status: PrintJobStatus | null;
}) {
  if (!status) {
    return <span className="text-xs text-brand-muted">لا يوجد</span>;
  }

  return <Badge tone={printTones[status]}>{PRINT_STATUS_LABELS[status]}</Badge>;
}
