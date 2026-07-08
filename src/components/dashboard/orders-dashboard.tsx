"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { OrderListRow } from "@/lib/orders/dashboard";
import type { OrderListFilter } from "@/lib/validations/order-status";
import { ORDER_TYPE_LABELS } from "@/lib/orders/status-transitions";
import { formatRestaurantDateTime } from "@/lib/time/restaurant-date";
import { formatPrice } from "@/lib/money";
import { OrderStatusBadge, PrintStatusBadge } from "@/components/dashboard/order-status-badge";
import { buttonPrimaryClassName } from "@/components/dashboard/form-ui";

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900">الطلبات</h1>
          <p className="text-sm text-stone-500">
            آخر تحديث: {formatRestaurantDateTime(lastUpdated.toISOString())}
            {loading ? " — جاري التحديث..." : ""}
          </p>
        </div>
        <Link href="/dashboard/orders/new" className={buttonPrimaryClassName()}>
          طلب يدوي
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-xs ${
              filter === f.value
                ? "bg-amber-600 text-white"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="py-8 text-center text-stone-500">لا توجد طلبات</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="px-2 py-2 text-right font-medium">الرقم</th>
                <th className="px-2 py-2 text-right font-medium">النوع</th>
                <th className="px-2 py-2 text-right font-medium">العميل / الطاولة</th>
                <th className="px-2 py-2 text-right font-medium">الوقت</th>
                <th className="px-2 py-2 text-right font-medium">الحالة</th>
                <th className="px-2 py-2 text-right font-medium">الطباعة</th>
                <th className="px-2 py-2 text-right font-medium">المجموع</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-stone-100 hover:bg-stone-50"
                >
                  <td className="px-2 py-3">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="font-medium text-amber-700 hover:underline"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-2 py-3">
                    {ORDER_TYPE_LABELS[order.order_type]}
                  </td>
                  <td className="px-2 py-3 text-stone-700">
                    {order.order_type === "DINE_IN"
                      ? order.table_label_snapshot ?? "—"
                      : (
                        <span>
                          {order.customer_name ?? "—"}
                          {order.customer_phone
                            ? ` (${order.customer_phone})`
                            : ""}
                        </span>
                      )}
                  </td>
                  <td className="px-2 py-3 text-stone-600">
                    {formatRestaurantDateTime(order.created_at)}
                  </td>
                  <td className="px-2 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-2 py-3">
                    <PrintStatusBadge status={order.latest_print_status} />
                  </td>
                  <td className="px-2 py-3 font-medium">
                    {formatPrice(order.total, currencyLabel)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
