"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { OrderListRow } from "@/lib/orders/dashboard";
import type { OrderListFilter } from "@/lib/validations/order-status";
import { formatRestaurantDateTime } from "@/lib/time/restaurant-date";
import { formatPrice } from "@/lib/money";
import {
  OrderStatusBadge,
  OrderTypeBadge,
  PrintStatusBadge,
} from "@/components/dashboard/order-status-badge";
import {
  buttonPrimaryClassName,
  EmptyState,
  PageHeader,
} from "@/components/dashboard/form-ui";

const FILTERS: { value: OrderListFilter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "NEW", label: "جديد" },
  { value: "WAITING_WHATSAPP_CONFIRMATION", label: "واتساب" },
  { value: "CONFIRMED", label: "مؤكد" },
  { value: "PREPARING", label: "تحضير" },
  { value: "READY", label: "جاهز" },
  { value: "COMPLETED", label: "مكتمل" },
  { value: "CANCELLED", label: "ملغى" },
  { value: "DINE_IN", label: "داخل المطعم" },
  { value: "DELIVERY", label: "توصيل" },
  { value: "PICKUP", label: "استلام" },
];

const POLL_MS = 8000;

function isUrgent(status: OrderListRow["status"]) {
  return status === "NEW" || status === "WAITING_WHATSAPP_CONFIRMATION";
}

export function OrdersDashboard({
  initialOrders,
  currencyLabel,
}: {
  initialOrders: OrderListRow[];
  currencyLabel: string;
}) {
  const [filter, setFilter] = useState<OrderListFilter>("all");
  const [orders, setOrders] = useState(initialOrders);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/orders?filter=${filter}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { orders: OrderListRow[] };
        setOrders(data.orders);
        setLastUpdated(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchOrders();
    const id = setInterval(() => void fetchOrders(), POLL_MS);
    return () => clearInterval(id);
  }, [fetchOrders]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="الطلبات"
        description={`آخر تحديث: ${formatRestaurantDateTime(
          lastUpdated.toISOString()
        )}`}
        actions={
          <Link
            href="/dashboard/orders/new"
            className={buttonPrimaryClassName()}
          >
            + طلب يدوي
          </Link>
        }
      />

      <div className="flex items-center gap-2 text-xs text-stone-500">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            loading ? "bg-amber-500" : "bg-green-500"
          }`}
        />
        {loading ? "جاري التحديث..." : "تحديث تلقائي كل ٨ ثوانٍ"}
      </div>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === f.value
                ? "bg-amber-600 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="لا توجد طلبات"
          description="ستظهر الطلبات الجديدة هنا تلقائياً فور استلامها."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="bg-stone-50 text-stone-500">
                  <th className="px-3 py-2.5 text-start font-semibold">الرقم</th>
                  <th className="px-3 py-2.5 text-start font-semibold">النوع</th>
                  <th className="px-3 py-2.5 text-start font-semibold">
                    العميل / الطاولة
                  </th>
                  <th className="px-3 py-2.5 text-start font-semibold">الوقت</th>
                  <th className="px-3 py-2.5 text-start font-semibold">الحالة</th>
                  <th className="px-3 py-2.5 text-start font-semibold">
                    الطباعة
                  </th>
                  <th className="px-3 py-2.5 text-start font-semibold">
                    المجموع
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const urgent = isUrgent(order.status);
                  return (
                    <tr
                      key={order.id}
                      className={`border-t border-stone-100 transition hover:bg-stone-50 ${
                        urgent ? "bg-amber-50/50" : ""
                      }`}
                    >
                      <td className="px-3 py-3">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="flex items-center gap-2 font-bold text-amber-700 hover:underline"
                        >
                          {urgent ? (
                            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                          ) : null}
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <OrderTypeBadge type={order.order_type} />
                      </td>
                      <td className="px-3 py-3 text-stone-700">
                        {order.order_type === "DINE_IN" ? (
                          order.table_label_snapshot ?? "—"
                        ) : (
                          <span>
                            {order.customer_name ?? "—"}
                            {order.customer_phone ? (
                              <span className="text-stone-400" dir="ltr">
                                {" "}
                                {order.customer_phone}
                              </span>
                            ) : null}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-stone-600">
                        {formatRestaurantDateTime(order.created_at)}
                      </td>
                      <td className="px-3 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-3 py-3">
                        <PrintStatusBadge status={order.latest_print_status} />
                      </td>
                      <td className="px-3 py-3 font-bold tabular-nums text-stone-900">
                        {formatPrice(order.total, currencyLabel)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
