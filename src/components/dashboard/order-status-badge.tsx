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
  NEW: "blue",
  WAITING_WHATSAPP_CONFIRMATION: "amber",
  CONFIRMED: "teal",
  PREPARING: "orange",
  READY: "green",
  COMPLETED: "stone",
  CANCELLED: "red",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={statusTones[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}

const typeTones: Record<OrderType, BadgeTone> = {
  DINE_IN: "teal",
  DELIVERY: "amber",
  PICKUP: "blue",
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
  PENDING: "amber",
  PRINTING: "blue",
  PRINTED: "green",
  FAILED: "red",
};

export function PrintStatusBadge({
  status,
}: {
  status: PrintJobStatus | null;
}) {
  if (!status) {
    return <span className="text-xs text-stone-400">لا يوجد</span>;
  }

  return <Badge tone={printTones[status]}>{PRINT_STATUS_LABELS[status]}</Badge>;
}
