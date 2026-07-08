"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import type { PublicMenu } from "@/lib/menu/public-menu";
import type { CreateOrderInput } from "@/lib/validations/order";
import { formatPrice } from "@/lib/money";

interface CheckoutClientProps {
  menu: PublicMenu;
  orderType: "DINE_IN" | "DELIVERY" | "PICKUP";
  tableToken?: string;
  successBasePath: string;
}

export function CheckoutClient({
  menu,
  orderType,
  tableToken,
  successBasePath,
}: CheckoutClientProps) {
  const router = useRouter();
  const { cart, getSubmitToken, clearCart, resetSubmitToken } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [orderNotes, setOrderNotes] = useState(cart.orderNotes);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      router.push(`${successBasePath}/${data.id}`);
    } catch {
      setError("تعذر الاتصال بالخادم");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-8">
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {orderType === "DELIVERY" ? (
        <>
          <Field label="الاسم" value={customerName} onChange={setCustomerName} required />
          <Field label="رقم الهاتف" value={customerPhone} onChange={setCustomerPhone} required dir="ltr" />
          <Field label="العنوان" value={customerAddress} onChange={setCustomerAddress} required />
          <Field
            label="رابط الموقع (اختياري)"
            value={locationUrl}
            onChange={setLocationUrl}
            dir="ltr"
            placeholder="https://maps.google.com/..."
          />
        </>
      ) : null}

      {orderType === "PICKUP" ? (
        <>
          <Field label="الاسم" value={customerName} onChange={setCustomerName} required />
          <Field label="رقم الهاتف" value={customerPhone} onChange={setCustomerPhone} required dir="ltr" />
          <Field
            label="وقت الاستلام (اختياري)"
            value={pickupTime}
            onChange={setPickupTime}
            placeholder="مثال: 19:30"
          />
        </>
      ) : null}

      {orderType === "DINE_IN" ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          سيتم إرسال الطلب إلى طاولتك تلقائياً.
        </p>
      ) : null}

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-800">
          ملاحظات الطلب (اختياري)
        </label>
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      {orderType === "DELIVERY" && menu.settings.default_delivery_fee > 0 ? (
        <p className="text-sm text-stone-600">
          رسوم التوصيل:{" "}
          {formatPrice(
            menu.settings.default_delivery_fee,
            menu.settings.currency_label
          )}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting || cart.lines.length === 0}
        className="w-full rounded-xl bg-amber-600 py-3 font-medium text-white disabled:opacity-60"
      >
        {submitting ? "جاري الإرسال..." : "تأكيد الطلب"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  dir,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  dir?: "ltr" | "rtl";
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-stone-800">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        dir={dir}
        placeholder={placeholder}
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
