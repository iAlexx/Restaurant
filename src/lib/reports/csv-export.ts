import type { OrderExportRow } from "@/lib/orders/dashboard";
import {
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
} from "@/lib/orders/status-transitions";
import { formatRestaurantDateTime } from "@/lib/time/restaurant-date";

const UTF8_BOM = "\uFEFF";

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildTodayOrdersCsv(rows: OrderExportRow[]): string {
  const header = [
    "رقم الطلب",
    "نوع الطلب",
    "الحالة",
    "المجموع الفرعي",
    "أجرة التوصيل",
    "إجمالي الرسوم",
    "الإجمالي",
    "وقت الإنشاء",
  ];

  const lines = rows.map((row) =>
    [
      row.order_number,
      ORDER_TYPE_LABELS[row.order_type],
      ORDER_STATUS_LABELS[row.status],
      String(row.subtotal),
      String(row.delivery_fee),
      String(row.charges_total),
      String(row.total),
      formatRestaurantDateTime(row.created_at),
    ]
      .map((cell) => escapeCsvField(cell))
      .join(",")
  );

  return UTF8_BOM + [header.join(","), ...lines].join("\r\n");
}
