import type { OrderStatus } from "@/types/database";
import {
  ORDER_STATUS_LABELS,
  PRINT_STATUS_LABELS,
} from "@/lib/orders/status-transitions";
import type { PrintJobStatus } from "@/types/database";

const statusColors: Record<OrderStatus, string> = {
  NEW: "bg-blue-100 text-blue-800",
  WAITING_WHATSAPP_CONFIRMATION: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-teal-100 text-teal-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-green-100 text-green-800",
  COMPLETED: "bg-stone-200 text-stone-700",
  CANCELLED: "bg-red-100 text-red-800",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function PrintStatusBadge({
  status,
}: {
  status: PrintJobStatus | null;
}) {
  if (!status) {
    return (
      <span className="text-xs text-stone-400">لا يوجد</span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-700">
      {PRINT_STATUS_LABELS[status]}
    </span>
  );
}
