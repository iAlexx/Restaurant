import { requireStaffPage } from "@/lib/auth/staff-page";
import { getDailyReportForStaff } from "@/lib/actions/reports";
import { formatPrice } from "@/lib/money";
import { RESTAURANT_TIMEZONE } from "@/lib/orders/status-transitions";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, type BadgeTone } from "@/components/dashboard/form-ui";

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

  const cards: {
    label: string;
    value: string;
    tone: BadgeTone;
    icon: string;
  }[] = [
    {
      label: "إجمالي الطلبات اليوم",
      value: String(report.total_orders),
      tone: "amber",
      icon: "🧾",
    },
    {
      label: "إجمالي قيمة الطلبات",
      value: formatPrice(report.total_value, currencyLabel),
      tone: "green",
      icon: "💰",
    },
    {
      label: "داخل المطعم",
      value: String(report.dine_in_count),
      tone: "teal",
      icon: "🍽",
    },
    {
      label: "توصيل",
      value: String(report.delivery_count),
      tone: "amber",
      icon: "🛵",
    },
    {
      label: "استلام",
      value: String(report.pickup_count),
      tone: "blue",
      icon: "🏪",
    },
    {
      label: "ملغاة",
      value: String(report.cancelled_count),
      tone: "red",
      icon: "🚫",
    },
  ];

  const toneRing: Record<BadgeTone, string> = {
    neutral: "bg-stone-50",
    amber: "bg-amber-50",
    blue: "bg-blue-50",
    teal: "bg-teal-50",
    orange: "bg-orange-50",
    green: "bg-green-50",
    red: "bg-red-50",
    stone: "bg-stone-50",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="التقرير اليومي"
        description={`تاريخ اليوم: ${report.date} — بتوقيت ${RESTAURANT_TIMEZONE} (UTC+3). الطلبات الملغاة لا تُحسب في الإجمالي أو القيمة.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${toneRing[card.tone]}`}
            >
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-stone-500">{card.label}</p>
              <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-stone-900">
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
