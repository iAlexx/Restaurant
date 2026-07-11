import type { ReactNode } from "react";
import type { OrderType } from "@/types/database";
import { ORDER_TYPE_LABELS } from "@/lib/orders/status-transitions";
import { formatPrice } from "@/lib/money";
import { Badge } from "@/components/dashboard/form-ui";

export interface OrderSummaryLine {
  key?: string;
  name: string;
  quantity: number;
  lineTotal: number;
  addOns?: { name: string; price?: number }[];
  notes?: string | null;
  actions?: ReactNode;
}

export interface OrderSummaryCardProps {
  currencyLabel: string;
  lines: OrderSummaryLine[];
  subtotal: number;
  deliveryFee?: number;
  chargeLines?: { label: string; amount: number }[];
  total: number;
  orderNumber?: string;
  orderType?: OrderType;
  tableLabel?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  orderNotes?: string | null;
  variant?: "cart" | "checkout" | "success";
  title?: string;
  /** When true, only render totals (cart uses CartLineCard for items). */
  totalsOnly?: boolean;
}

const typeBadgeTone = {
  DINE_IN: "dine_in",
  DELIVERY: "delivery",
  PICKUP: "pickup",
} as const;

export function OrderSummaryCard({
  currencyLabel,
  lines,
  subtotal,
  deliveryFee = 0,
  chargeLines = [],
  total,
  orderNumber,
  orderType,
  tableLabel,
  customerName,
  customerPhone,
  orderNotes,
  variant = "checkout",
  title,
  totalsOnly = false,
}: OrderSummaryCardProps) {
  const heading =
    title ??
    (variant === "cart"
      ? "ملخص السلة"
      : variant === "success"
        ? "تفاصيل الطلب"
        : "ملخص الطلب");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-extrabold text-brand-chocolate sm:text-xl">
          {heading}
        </h2>
        {orderType ? (
          <Badge tone={typeBadgeTone[orderType]}>
            {ORDER_TYPE_LABELS[orderType]}
          </Badge>
        ) : null}
      </div>

      {orderNumber ? (
        <div className="rounded-2xl border-2 border-brand-gold/50 bg-brand-surface px-5 py-4 text-center shadow-sm">
          <p className="text-sm font-semibold text-brand-muted">رقم الطلب</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-brand-orange sm:text-4xl">
            {orderNumber}
          </p>
        </div>
      ) : null}

      {(tableLabel || customerName || customerPhone) && (
        <dl className="grid gap-2 rounded-xl border border-brand-gold/40 bg-brand-surface px-4 py-3 text-sm">
          {tableLabel ? (
            <div className="flex justify-between gap-3">
              <dt className="text-brand-muted">الطاولة</dt>
              <dd className="font-bold text-brand-chocolate">{tableLabel}</dd>
            </div>
          ) : null}
          {customerName ? (
            <div className="flex justify-between gap-3">
              <dt className="text-brand-muted">العميل</dt>
              <dd className="font-bold text-brand-chocolate">{customerName}</dd>
            </div>
          ) : null}
          {customerPhone ? (
            <div className="flex justify-between gap-3">
              <dt className="text-brand-muted">الهاتف</dt>
              <dd className="font-bold text-brand-chocolate" dir="ltr">
                {customerPhone}
              </dd>
            </div>
          ) : null}
        </dl>
      )}

      {!totalsOnly && lines.length > 0 ? (
        <ul className="divide-y divide-brand-gold/30 rounded-2xl border border-brand-gold/40 bg-brand-surface shadow-sm">
          {lines.map((line, index) => (
            <li
              key={line.key ?? `${line.name}-${index}`}
              className="px-4 py-4 sm:px-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-brand-chocolate">
                    {line.name}{" "}
                    <span className="font-semibold text-brand-muted">
                      × {line.quantity}
                    </span>
                  </p>
                  {line.addOns && line.addOns.length > 0 ? (
                    <ul className="mt-1.5 space-y-0.5">
                      {line.addOns.map((addOn, i) => (
                        <li
                          key={`${addOn.name}-${i}`}
                          className="text-sm text-brand-muted"
                        >
                          + {addOn.name}
                          {addOn.price != null && addOn.price > 0
                            ? ` (${formatPrice(addOn.price, currencyLabel)})`
                            : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {line.notes ? (
                    <p className="mt-2 rounded-lg border border-brand-gold/40 bg-brand-gold-soft px-2.5 py-1.5 text-xs leading-relaxed text-brand-chocolate">
                      ملاحظة: {line.notes}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 text-end">
                  <p className="text-lg font-extrabold tabular-nums text-brand-orange">
                    {formatPrice(line.lineTotal, currencyLabel)}
                  </p>
                  {line.actions ? (
                    <div className="mt-2">{line.actions}</div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {orderNotes ? (
        <div className="rounded-xl border border-brand-gold/40 bg-brand-gold-soft px-4 py-3 text-sm leading-relaxed text-brand-chocolate">
          <span className="font-bold">ملاحظات الطلب: </span>
          {orderNotes}
        </div>
      ) : null}

      <dl className="space-y-2 rounded-2xl border border-brand-gold/40 bg-brand-surface p-4 shadow-sm sm:p-5">
        <div className="flex justify-between gap-3 text-sm sm:text-base">
          <dt className="text-brand-muted">المجموع الفرعي</dt>
          <dd className="font-semibold tabular-nums text-brand-chocolate">
            {formatPrice(subtotal, currencyLabel)}
          </dd>
        </div>
        {deliveryFee > 0 ? (
          <div className="flex justify-between gap-3 text-sm sm:text-base">
            <dt className="text-brand-muted">أجرة التوصيل</dt>
            <dd className="font-semibold tabular-nums text-brand-chocolate">
              {formatPrice(deliveryFee, currencyLabel)}
            </dd>
          </div>
        ) : null}
        {chargeLines.map((charge) => (
          <div
            key={charge.label}
            className="flex justify-between gap-3 text-sm sm:text-base"
          >
            <dt className="text-brand-muted">{charge.label}</dt>
            <dd className="font-semibold tabular-nums text-brand-chocolate">
              {formatPrice(charge.amount, currencyLabel)}
            </dd>
          </div>
        ))}
        <div className="border-t border-brand-gold/50 pt-3">
          <div className="flex justify-between gap-3">
            <dt className="text-lg font-extrabold text-brand-chocolate">
              الإجمالي
            </dt>
            <dd className="text-xl font-extrabold tabular-nums text-brand-orange sm:text-2xl">
              {formatPrice(total, currencyLabel)}
            </dd>
          </div>
        </div>
      </dl>
    </div>
  );
}
