"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, estimateCartTotal } from "@/contexts/cart-context";
import type { PublicMenu } from "@/lib/menu/public-menu";
import type { CreateOrderInput } from "@/lib/validations/order";
import { formatPrice } from "@/lib/money";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

interface CheckoutClientProps {
  menu: PublicMenu;
  orderType: "DINE_IN" | "DELIVERY" | "PICKUP";
  tableToken?: string;
  tableLabel?: string;
  successBasePath: string;
  /** Full success URL for unified flow (includes ?table= query). */
  unifiedSuccessPath?: (orderId: string) => string;
}

export function CheckoutClient({
  menu,
  orderType,
  tableToken,
  tableLabel,
  successBasePath,
  unifiedSuccessPath,
}: CheckoutClientProps) {
  const router = useRouter();
  const { cart, getSubmitToken, clearCart, resetSubmitToken } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [orderNotes, setOrderNotes] = useState(cart.orderNotes);

  const currency = menu.settings.currency_label;
  const subtotal = estimateCartTotal(cart.lines, menu.products, menu.addOns);
  const deliveryFee =
    orderType === "DELIVERY" ? menu.settings.default_delivery_fee : 0;
  const total = subtotal + deliveryFee;

  const minDelivery = menu.settings.min_delivery_order;
  const belowMinimum =
    orderType === "DELIVERY" && minDelivery > 0 && subtotal < minDelivery;

  async function submitOrder() {
    setError(null);
    setSubmitting(true);

    const items = cart.lines.map((line) => ({
      product_id: line.productId,
      quantity: line.quantity,
      add_on_ids: line.addOnIds,
      notes: line.notes || null,
    }));

    const base = {
      submit_token: getSubmitToken(),
      order_type: orderType,
      items,
      notes: orderNotes || null,
    };

    let payload: CreateOrderInput;

    if (orderType === "DINE_IN") {
      if (!tableToken) {
        setError("رمز الطاولة غير صالح");
        setSubmitting(false);
        return;
      }
      payload = { ...base, order_type: "DINE_IN", table_token: tableToken };
    } else if (orderType === "DELIVERY") {
      payload = {
        ...base,
        order_type: "DELIVERY",
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        location_url: locationUrl || null,
      };
    } else {
      payload = {
        ...base,
        order_type: "PICKUP",
        customer_name: customerName,
        customer_phone: customerPhone,
        pickup_time: pickupTime || null,
      };
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "تعذر إرسال الطلب");
        setSubmitting(false);
        return;
      }

      clearCart();
      resetSubmitToken();
      const successHref = unifiedSuccessPath
        ? unifiedSuccessPath(data.id)
        : `${successBasePath}/${data.id}`;
      router.push(successHref);
    } catch {
      setError("تعذر الاتصال بالخادم");
      setSubmitting(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (orderType === "DINE_IN" && tableLabel) {
      setConfirmOpen(true);
      return;
    }
    void submitOrder();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8">
      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {orderType === "DINE_IN" ? (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>
            سيتم إرسال الطلب إلى طاولتك مباشرة. لا حاجة لإدخال بيانات إضافية.
          </p>
          {tableLabel ? (
            <p className="font-bold">
              الطاولة المختارة: {tableLabel}
            </p>
          ) : null}
        </div>
      ) : null}

      {orderType !== "DINE_IN" ? (
        <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-sm font-bold text-stone-900">بيانات العميل</p>
          <Field
            label="الاسم"
            value={customerName}
            onChange={setCustomerName}
            required
          />
          <Field
            label="رقم الهاتف"
            value={customerPhone}
            onChange={setCustomerPhone}
            required
            dir="ltr"
            placeholder="09XXXXXXXX"
            inputMode="tel"
          />
          {orderType === "DELIVERY" ? (
            <>
              <Field
                label="العنوان"
                value={customerAddress}
                onChange={setCustomerAddress}
                required
              />
              <Field
                label="رابط الموقع (اختياري)"
                value={locationUrl}
                onChange={setLocationUrl}
                dir="ltr"
                placeholder="https://maps.google.com/..."
              />
            </>
          ) : (
            <Field
              label="وقت الاستلام (اختياري)"
              value={pickupTime}
              onChange={setPickupTime}
              placeholder="مثال: 19:30"
            />
          )}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="order-notes"
          className="mb-1.5 block text-sm font-semibold text-stone-800"
        >
          ملاحظات الطلب (اختياري)
        </label>
        <textarea
          id="order-notes"
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="أي تعليمات خاصة بالطلب"
          className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-200"
        />
      </div>

      <div className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <SummaryRow label="المجموع الفرعي" value={formatPrice(subtotal, currency)} />
        {deliveryFee > 0 ? (
          <SummaryRow
            label="رسوم التوصيل"
            value={formatPrice(deliveryFee, currency)}
          />
        ) : null}
        <div className="border-t border-stone-200 pt-2">
          <SummaryRow
            label="الإجمالي التقديري"
            value={formatPrice(total, currency)}
            strong
          />
        </div>
      </div>

      {belowMinimum ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          الحد الأدنى لطلب التوصيل هو {formatPrice(minDelivery, currency)}. أضف
          المزيد من الأصناف للمتابعة.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting || cart.lines.length === 0 || belowMinimum}
        className="w-full rounded-2xl bg-amber-600 py-3.5 font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "جاري الإرسال..." : "تأكيد الطلب"}
      </button>

      {orderType === "DINE_IN" && tableLabel ? (
        <ConfirmDialog
          open={confirmOpen}
          title="تأكيد الطاولة"
          description={`أنت تطلب للطاولة ${tableLabel} — هل الرقم صحيح؟`}
          confirmLabel="نعم، إرسال الطلب"
          cancelLabel="رجوع"
          pending={submitting}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            void submitOrder();
          }}
        />
      ) : null}
    </form>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={strong ? "font-bold text-stone-900" : "text-stone-600"}>
        {label}
      </span>
      <span
        className={`tabular-nums ${
          strong ? "text-lg font-bold text-stone-900" : "text-stone-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  dir,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  dir?: "ltr" | "rtl";
  placeholder?: string;
  inputMode?: "tel" | "text";
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-stone-800">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        dir={dir}
        inputMode={inputMode}
        placeholder={placeholder}
        className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-200"
      />
    </div>
  );
}
