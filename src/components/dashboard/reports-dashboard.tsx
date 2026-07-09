"use client";

import type { DailyReportSummary } from "@/lib/orders/dashboard";
import { formatPrice } from "@/lib/money";
import { RESTAURANT_TIMEZONE } from "@/lib/orders/status-transitions";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  type BadgeTone,
} from "@/components/dashboard/form-ui";

export function ReportsDashboard({
  report,
  currencyLabel,
}: {
  report: DailyReportSummary;
  currencyLabel: string;
}) {
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
      <div className="no-print flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className={buttonPrimaryClassName()}
        >
          طباعة التقرير
        </button>
        <a
          href="/api/dashboard/reports/export"
          className={buttonSecondaryClassName()}
          download
        >
          تصدير CSV
        </a>
      </div>

      <div className="print-area space-y-6">
        <div className="hidden print:block">
          <h1 className="text-2xl font-bold text-stone-900">التقرير اليومي</h1>
          <p className="mt-1 text-sm text-stone-600">
            تاريخ اليوم: {report.date} — بتوقيت {RESTAURANT_TIMEZONE} (UTC+3)
          </p>
          <p className="mt-1 text-xs text-stone-500">
            الطلبات الملغاة لا تُحسب في الإجمالي أو القيمة.
          </p>
        </div>

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

        <p className="hidden text-xs text-stone-400 print:block">
          طُبع في {new Date().toLocaleString("ar-SY", { timeZone: RESTAURANT_TIMEZONE })}
        </p>
      </div>
    </div>
  );
}
