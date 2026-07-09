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
  total: number;
  orderNumber?: string;
  orderType?: OrderType;
  tableLabel?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  orderNotes?: string | null;
  variant?: "cart" | "checkout" | "success";
  title?: string;
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
  total,
  orderNumber,
  orderType,
  tableLabel,
  customerName,
  customerPhone,
  orderNotes,
  variant = "checkout",
  title,
}: OrderSummaryCardProps) {
  const heading =
    title ??
    (variant === "cart"
      ? "ملخص السلة"
      : variant === "success"
        ? "تفاصيل الطلب"
        : "ملخص الطلب");

  return (
    <div className={`${variant === "success" ? "" : ""} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-base font-bold text-brand-chocolate">{heading}</h2>
        {orderType ? (
          <Badge tone={typeBadgeTone[orderType]}>
            {ORDER_TYPE_LABELS[orderType]}
          </Badge>
        ) : null}
      </div>

      {orderNumber ? (
        <div>
          <p className="text-xs text-brand-muted">رقم الطلب</p>
          <p className="text-2xl font-extrabold tracking-tight text-brand-orange">
            {orderNumber}
          </p>
        </div>
      ) : null}

      {(tableLabel || customerName || customerPhone) && (
        <dl className="grid gap-2 rounded-xl border border-brand-gold/40 bg-brand-cream px-3 py-3 text-sm">
          {tableLabel ? (
            <div className="flex justify-between gap-3">
              <dt className="text-brand-muted">الطاولة</dt>
              <dd className="font-semibold text-brand-chocolate">{tableLabel}</dd>
            </div>
          ) : null}
          {customerName ? (
            <div className="flex justify-between gap-3">
              <dt className="text-brand-muted">العميل</dt>
              <dd className="font-semibold text-brand-chocolate">{customerName}</dd>
            </div>
          ) : null}
          {customerPhone ? (
            <div className="flex justify-between gap-3">
              <dt className="text-brand-muted">الهاتف</dt>
              <dd className="font-semibold text-brand-chocolate" dir="ltr">
                {customerPhone}
              </dd>
            </div>
          ) : null}
        </dl>
      )}

      <ul className="divide-y divide-brand-gold/35 rounded-xl border border-brand-border bg-brand-surface">
        {lines.map((line, index) => (
          <li
            key={line.key ?? `${line.name}-${index}`}
            className="px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-brand-chocolate">
                  {line.name}{" "}
                  <span className="text-brand-muted">× {line.quantity}</span>
                </p>
                {line.addOns && line.addOns.length > 0 ? (
                  <ul className="mt-1 space-y-0.5">
                    {line.addOns.map((addOn, i) => (
                      <li
                        key={`${addOn.name}-${i}`}
                        className="text-xs text-brand-muted"
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
                  <p className="mt-2 rounded-lg border border-brand-gold/40 bg-brand-cream px-2.5 py-1.5 text-xs text-brand-chocolate">
                    ملاحظة: {line.notes}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 text-end">
                <p className="font-bold tabular-nums text-brand-orange">
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

      {orderNotes ? (
        <div className="rounded-xl border border-brand-gold/40 bg-brand-cream px-3 py-2.5 text-sm text-brand-chocolate">
          <span className="font-semibold">ملاحظات الطلب: </span>
          {orderNotes}
        </div>
      ) : null}

      <dl className="space-y-2 rounded-xl border border-brand-border bg-brand-cream p-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-brand-muted">المجموع الفرعي</dt>
          <dd className="tabular-nums text-brand-chocolate">
            {formatPrice(subtotal, currencyLabel)}
          </dd>
        </div>
        {deliveryFee > 0 ? (
          <div className="flex justify-between gap-3">
            <dt className="text-brand-muted">رسوم التوصيل</dt>
            <dd className="tabular-nums text-brand-chocolate">
              {formatPrice(deliveryFee, currencyLabel)}
            </dd>
          </div>
        ) : null}
        <div className="border-t border-brand-gold/50 pt-2">
          <div className="flex justify-between gap-3">
            <dt className="text-base font-bold text-brand-chocolate">الإجمالي</dt>
            <dd className="text-lg font-extrabold tabular-nums text-brand-orange">
              {formatPrice(total, currencyLabel)}
            </dd>
          </div>
        </div>
      </dl>
    </div>
  );
}
