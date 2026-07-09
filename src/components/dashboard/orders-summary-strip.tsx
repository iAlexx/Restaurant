import type { OrdersOperationalSummary } from "@/lib/orders/dashboard";
import { formatPrice } from "@/lib/money";

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
      tone: "text-stone-900",
    },
    {
      label: "جديد / عاجل",
      value: String(summary.urgent_count),
      tone: summary.urgent_count > 0 ? "text-amber-700" : "text-stone-900",
    },
    {
      label: "قيد التحضير",
      value: String(summary.preparing_count),
      tone: "text-stone-900",
    },
    {
      label: "إيراد اليوم",
      value: formatPrice(summary.total_value, currencyLabel),
      tone: "text-green-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-stone-200 bg-white px-3 py-3 shadow-sm"
        >
          <p className="text-xs text-stone-500">{item.label}</p>
          <p className={`mt-1 text-lg font-bold tabular-nums ${item.tone}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
