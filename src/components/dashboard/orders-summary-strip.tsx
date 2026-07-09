import type { OrdersOperationalSummary } from "@/lib/orders/dashboard";
import { formatPrice } from "@/lib/money";
import { cardSurfaceClassName } from "@/components/dashboard/form-ui";

export function OrdersSummaryStrip({
  summary,
  currencyLabel,
}: {
  summary: OrdersOperationalSummary;
  currencyLabel: string;
}) {
  const items = [
    {
      label: "طلبات اليوم",
      value: String(summary.total_orders),
      tone: "text-brand-chocolate",
    },
    {
      label: "جديد / عاجل",
      value: String(summary.urgent_count),
      tone:
        summary.urgent_count > 0
          ? "text-brand-orange"
          : "text-brand-chocolate",
    },
    {
      label: "قيد التحضير",
      value: String(summary.preparing_count),
      tone: "text-brand-chocolate",
    },
    {
      label: "إيراد اليوم",
      value: formatPrice(summary.total_value, currencyLabel),
      tone: "text-brand-green",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`${cardSurfaceClassName()} px-3 py-3`}
        >
          <p className="text-xs text-brand-muted">{item.label}</p>
          <p className={`mt-1 text-lg font-bold tabular-nums ${item.tone}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
