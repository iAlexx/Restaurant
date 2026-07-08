import { requireStaffPage } from "@/lib/auth/staff-page";
import { getDailyReportForStaff } from "@/lib/actions/reports";
import { formatPrice } from "@/lib/money";
import { RESTAURANT_TIMEZONE } from "@/lib/orders/status-transitions";
import { createClient } from "@/lib/supabase/server";

export default async function ReportsPage() {
  await requireStaffPage("/dashboard/reports");

  const [report, settings] = await Promise.all([
    getDailyReportForStaff(),
    createClient()
      .then((supabase) =>
        supabase
          .from("restaurant_settings")
          .select("currency_label")
          .eq("id", 1)
          .single()
      ),
  ]);

  const currencyLabel =
    (settings.data as { currency_label: string } | null)?.currency_label ?? "ل.س";

  const cards = [
    { label: "إجمالي الطلبات اليوم", value: String(report.total_orders) },
    {
      label: "إجمالي قيمة الطلبات",
      value: formatPrice(report.total_value, currencyLabel),
    },
    { label: "داخل المطعم", value: String(report.dine_in_count) },
    { label: "توصيل", value: String(report.delivery_count) },
    { label: "استلام", value: String(report.pickup_count) },
    { label: "ملغاة", value: String(report.cancelled_count) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">التقرير اليومي</h1>
        <p className="mt-1 text-sm text-stone-500">
          تاريخ اليوم: {report.date} — المنطقة الزمنية: {RESTAURANT_TIMEZONE}
        </p>
        <p className="mt-1 text-xs text-stone-400">
          يُحسب اليوم من 00:00 إلى 23:59:59 بتوقيت دمشق (UTC+3).
          الطلبات الملغاة لا تُحسب في الإجمالي أو القيمة.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-stone-200 p-4"
          >
            <p className="text-sm text-stone-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-stone-900">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
