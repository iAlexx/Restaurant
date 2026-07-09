"use client";

import type { DailyReportSummary } from "@/lib/orders/dashboard";
import { formatPrice } from "@/lib/money";
import { RESTAURANT_TIMEZONE } from "@/lib/orders/status-transitions";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  cardSurfaceClassName,
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
    ring: string;
    icon: string;
  }[] = [
    {
      label: "إجمالي الطلبات اليوم",
      value: String(report.total_orders),
      ring: "bg-brand-orange-soft",
      icon: "🧾",
    },
    {
      label: "إجمالي قيمة الطلبات",
      value: formatPrice(report.total_value, currencyLabel),
      ring: "bg-brand-green-soft",
      icon: "💰",
    },
    {
      label: "داخل المطعم",
      value: String(report.dine_in_count),
      ring: "bg-brand-gold-soft",
      icon: "🍽",
    },
    {
      label: "توصيل",
      value: String(report.delivery_count),
      ring: "bg-brand-orange-soft",
      icon: "🛵",
    },
    {
      label: "استلام",
      value: String(report.pickup_count),
      ring: "bg-brand-cream",
      icon: "🏪",
    },
    {
      label: "ملغاة",
      value: String(report.cancelled_count),
      ring: "bg-red-50",
      icon: "🚫",
    },
  ];

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
          <h1 className="text-2xl font-bold text-brand-chocolate">التقرير اليومي</h1>
          <p className="mt-1 text-sm text-brand-muted">
            تاريخ اليوم: {report.date} — بتوقيت {RESTAURANT_TIMEZONE} (UTC+3)
          </p>
          <p className="mt-1 text-xs text-brand-muted">
            الطلبات الملغاة لا تُحسب في الإجمالي أو القيمة.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`flex items-center gap-4 ${cardSurfaceClassName()} p-4`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${card.ring}`}
              >
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-brand-muted">{card.label}</p>
                <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-brand-chocolate">
                  {card.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="hidden text-xs text-brand-muted print:block">
          طُبع في {new Date().toLocaleString("ar-SY", { timeZone: RESTAURANT_TIMEZONE })}
        </p>
      </div>
    </div>
  );
}
