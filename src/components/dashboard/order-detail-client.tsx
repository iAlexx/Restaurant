"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useState } from "react";
import {
  cancelOrderAction,
  reprintOrderAction,
  updateOrderStatusAction,
} from "@/lib/actions/orders";
import type { Order, OrderCharge, OrderItem, OrderItemAddOn, PrintJob } from "@/types/database";
import { formatChargeDisplayLabel } from "@/lib/charges/calculate";
import {
  getAllowedNextStatuses,
  isTerminalStatus,
  ORDER_STATUS_LABELS,
} from "@/lib/orders/status-transitions";
import { formatRestaurantDateTime } from "@/lib/time/restaurant-date";
import { formatPrice } from "@/lib/money";
import {
  OrderStatusBadge,
  OrderTypeBadge,
  PrintStatusBadge,
} from "@/components/dashboard/order-status-badge";
import {
  FormAlert,
  Card,
  buttonDangerClassName,
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-ui";

const POLL_MS = 8000;

interface OrderDetailData {
  order: Order;
  items: OrderItem[];
  addOns: OrderItemAddOn[];
  orderCharges: OrderCharge[];
  printJobs: PrintJob[];
  currency_label: string;
  created_by_display_name: string | null;
}

export function OrderDetailClient({
  orderId,
  initial,
}: {
  orderId: string;
  initial: OrderDetailData;
}) {
  const [data, setData] = useState(initial);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);

  const [statusState, statusAction, statusPending] = useActionState(
    updateOrderStatusAction,
    {}
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelOrderAction,
    {}
  );
  const [reprintState, reprintAction, reprintPending] = useActionState(
    reprintOrderAction,
    {}
  );

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/dashboard/orders/${orderId}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = (await res.json()) as OrderDetailData;
      setData(json);
    }
  }, [orderId]);

  useEffect(() => {
    const id = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (statusState.success || cancelState.success || reprintState.success) {
      void refresh();
      setShowCancel(false);
      setCancelReason("");
    }
  }, [statusState.success, cancelState.success, reprintState.success, refresh]);

  const { order, items, addOns, printJobs, currency_label, created_by_display_name } =
    data;
  const addOnsByItem = new Map<string, OrderItemAddOn[]>();
  for (const addOn of addOns) {
    const list = addOnsByItem.get(addOn.order_item_id) ?? [];
    list.push(addOn);
    addOnsByItem.set(addOn.order_item_id, list);
  }

  const nextStatuses = getAllowedNextStatuses(order.status).filter(
    (s) => s !== "CANCELLED"
  );
  const canCancel = !isTerminalStatus(order.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/orders"
            className="text-sm text-brand-orange hover:underline"
          >
            ← العودة للطلبات
          </Link>
          <h1 className="mt-2 text-xl font-bold text-brand-chocolate">
            طلب {order.order_number}
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            {formatRestaurantDateTime(order.created_at)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <FormAlert message={statusState.error} type="error" />
      <FormAlert message={statusState.success} type="success" />
      <FormAlert message={cancelState.error} type="error" />
      <FormAlert message={cancelState.success} type="success" />
      <FormAlert message={reprintState.error} type="error" />
      <FormAlert message={reprintState.success} type="success" />

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-brand-chocolate">معلومات الطلب</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-brand-muted">النوع</dt>
              <dd>
                <OrderTypeBadge type={order.order_type} />
              </dd>
            </div>
            {order.table_label_snapshot && (
              <div className="flex justify-between gap-4">
                <dt className="text-brand-muted">الطاولة</dt>
                <dd>{order.table_label_snapshot}</dd>
              </div>
            )}
            {order.customer_name && (
              <div className="flex justify-between gap-4">
                <dt className="text-brand-muted">العميل</dt>
                <dd>{order.customer_name}</dd>
              </div>
            )}
            {order.customer_phone && (
              <div className="flex justify-between gap-4">
                <dt className="text-brand-muted">الهاتف</dt>
                <dd dir="ltr" className="text-left">
                  {order.customer_phone}
                </dd>
              </div>
            )}
            {order.customer_address && (
              <div className="flex justify-between gap-4">
                <dt className="text-brand-muted">العنوان</dt>
                <dd className="text-left">{order.customer_address}</dd>
              </div>
            )}
            {order.location_url && (
              <div className="flex justify-between gap-4">
                <dt className="text-brand-muted">الموقع</dt>
                <dd>
                  <a
                    href={order.location_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-orange hover:underline"
                  >
                    فتح الرابط
                  </a>
                </dd>
              </div>
            )}
            {order.pickup_time && (
              <div className="flex justify-between gap-4">
                <dt className="text-brand-muted">وقت الاستلام</dt>
                <dd>{order.pickup_time}</dd>
              </div>
            )}
            {order.notes && (
              <div>
                <dt className="text-brand-muted">ملاحظات</dt>
                <dd className="mt-1">{order.notes}</dd>
              </div>
            )}
            {order.created_by && created_by_display_name && (
              <div className="flex justify-between gap-4">
                <dt className="text-brand-muted">أُنشئ يدوياً بواسطة</dt>
                <dd>{created_by_display_name}</dd>
              </div>
            )}
            {order.cancellation_reason && (
              <div>
                <dt className="text-brand-muted">سبب الإلغاء</dt>
                <dd className="mt-1 text-red-700">{order.cancellation_reason}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <h2 className="font-semibold text-brand-chocolate">الإجراءات</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {nextStatuses.map((status) => (
              <form key={status} action={statusAction}>
                <input type="hidden" name="order_id" value={order.id} />
                <input
                  type="hidden"
                  name="expected_status"
                  value={order.status}
                />
                <input type="hidden" name="new_status" value={status} />
                <button
                  type="submit"
                  disabled={statusPending}
                  className={buttonPrimaryClassName()}
                >
                  {ORDER_STATUS_LABELS[status]}
                </button>
              </form>
            ))}

            {canCancel && (
              <button
                type="button"
                onClick={() => setShowCancel((v) => !v)}
                className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                إلغاء الطلب
              </button>
            )}

            <form action={reprintAction}>
              <input type="hidden" name="order_id" value={order.id} />
              <button
                type="submit"
                disabled={reprintPending}
                className={buttonSecondaryClassName()}
              >
                إعادة طباعة
              </button>
            </form>
          </div>

          {showCancel && canCancel && (
            <form action={cancelAction} className="mt-4 space-y-3">
              <input type="hidden" name="order_id" value={order.id} />
              <input
                type="hidden"
                name="expected_status"
                value={order.status}
              />
              <div>
                <label className={labelClassName()} htmlFor="cancellation_reason">
                  سبب الإلغاء
                </label>
                <textarea
                  id="cancellation_reason"
                  name="cancellation_reason"
                  required
                  minLength={3}
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className={inputClassName()}
                />
              </div>
              <button
                type="submit"
                disabled={cancelPending}
                className={buttonDangerClassName()}
              >
                تأكيد الإلغاء
              </button>
            </form>
          )}
        </Card>
      </section>

      <Card>
        <h2 className="font-semibold text-brand-chocolate">الأصناف</h2>
        <ul className="mt-3 divide-y divide-brand-gold/35">
          {items.map((item) => (
            <li key={item.id} className="py-3">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {item.product_name_snapshot} × {item.quantity}
                  </p>
                  {item.notes && (
                    <p className="mt-1 text-sm text-brand-muted">{item.notes}</p>
                  )}
                  {(addOnsByItem.get(item.id) ?? []).map((a) => (
                    <p key={a.id} className="text-sm text-brand-muted">
                      + {a.name_snapshot} ({formatPrice(a.price_snapshot, currency_label)})
                    </p>
                  ))}
                </div>
                <p className="font-medium">
                  {formatPrice(item.line_total, currency_label)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-brand-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-brand-muted">المجموع الفرعي</dt>
            <dd>{formatPrice(order.subtotal, currency_label)}</dd>
          </div>
          {order.delivery_fee > 0 && (
            <div className="flex justify-between">
              <dt className="text-brand-muted">أجرة التوصيل</dt>
              <dd>{formatPrice(order.delivery_fee, currency_label)}</dd>
            </div>
          )}
          {data.orderCharges.map((charge) => (
            <div key={charge.id} className="flex justify-between">
              <dt className="text-brand-muted">
                {formatChargeDisplayLabel(
                  charge.name_snapshot,
                  charge.calculation_type_snapshot,
                  charge.value_snapshot
                )}
              </dt>
              <dd>{formatPrice(charge.calculated_amount, currency_label)}</dd>
            </div>
          ))}
          <div className="flex justify-between text-base font-bold">
            <dt>الإجمالي</dt>
            <dd className="tabular-nums">
              {formatPrice(order.total, currency_label)}
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h2 className="font-semibold text-brand-chocolate">سجل الطباعة</h2>
        {printJobs.length === 0 ? (
          <p className="mt-2 text-sm text-brand-muted">لا يوجد سجل طباعة</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {printJobs.map((job) => (
              <li
                key={job.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-brand-cream px-3 py-2"
              >
                <span className="flex items-center gap-2">
                  <PrintStatusBadge status={job.status} />
                  {job.is_reprint ? (
                    <span className="text-xs text-brand-muted">
                      (إعادة طباعة)
                    </span>
                  ) : null}
                </span>
                <span className="text-brand-muted">
                  {formatRestaurantDateTime(job.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
