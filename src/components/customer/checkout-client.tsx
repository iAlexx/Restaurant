"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, estimateCartTotal } from "@/contexts/cart-context";
import type { PublicMenu } from "@/lib/menu/public-menu";
import type { CreateOrderInput } from "@/lib/validations/order";
import { formatPrice } from "@/lib/money";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { OrderSummaryCard } from "@/components/customer/order-summary-card";
import {
  buttonPrimaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-ui";

interface CheckoutClientProps {
  menu: PublicMenu;
  orderType: "DINE_IN" | "DELIVERY" | "PICKUP";
  tableToken?: string;
  tableLabel?: string;
  successBasePath: string;
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
  const productMap = useMemo(
    () => new Map(menu.products.map((p) => [p.id, p])),
    [menu.products]
  );
  const addOnMap = useMemo(
    () => new Map(menu.addOns.map((a) => [a.id, a])),
    [menu.addOns]
  );

  const subtotal = estimateCartTotal(cart.lines, menu.products, menu.addOns);
  const deliveryFee =
    orderType === "DELIVERY" ? menu.settings.default_delivery_fee : 0;
  const total = subtotal + deliveryFee;

  const minDelivery = menu.settings.min_delivery_order;
  const belowMinimum =
    orderType === "DELIVERY" && minDelivery > 0 && subtotal < minDelivery;

  const summaryLines = useMemo(
    () =>
      cart.lines
        .map((line) => {
          const product = productMap.get(line.productId);
          if (!product) return null;
          const addOnTotal = line.addOnIds.reduce(
            (s, id) => s + (addOnMap.get(id)?.extra_price ?? 0),
            0
          );
          return {
            key: line.key,
            name: product.name_ar,
            quantity: line.quantity,
            lineTotal: (product.price + addOnTotal) * line.quantity,
            addOns: line.addOnIds.map((id) => ({
              name: addOnMap.get(id)?.name_ar ?? "",
              price: addOnMap.get(id)?.extra_price,
            })),
            notes: line.notes || null,
          };
        })
        .filter((line): line is NonNullable<typeof line> => line !== null),
    [cart.lines, productMap, addOnMap]
  );

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
        <div className="space-y-2 rounded-xl border border-brand-gold/45 bg-brand-gold-soft px-4 py-3 text-sm text-brand-chocolate">
          <p>
            سيتم إرسال الطلب إلى طاولتك مباشرة. لا حاجة لإدخال بيانات إضافية.
          </p>
          {tableLabel ? (
            <p className="font-bold">الطاولة المختارة: {tableLabel}</p>
          ) : null}
        </div>
      ) : null}

      {orderType !== "DINE_IN" ? (
        <div className="space-y-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
          <p className="text-sm font-bold text-brand-chocolate">بيانات العميل</p>
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
        <label htmlFor="order-notes" className={labelClassName()}>
          ملاحظات الطلب (اختياري)
        </label>
        <textarea
          id="order-notes"
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="أي تعليمات خاصة بالطلب"
          className={inputClassName()}
        />
      </div>

      <OrderSummaryCard
        variant="checkout"
        currencyLabel={currency}
        lines={summaryLines}
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        total={total}
        orderType={orderType}
        tableLabel={tableLabel}
        customerName={orderType !== "DINE_IN" ? customerName || null : null}
        customerPhone={orderType !== "DINE_IN" ? customerPhone || null : null}
        orderNotes={orderNotes || null}
      />

      {belowMinimum ? (
        <p className="rounded-lg border border-brand-gold/50 bg-brand-gold-soft px-3 py-2 text-sm text-brand-chocolate">
          الحد الأدنى لطلب التوصيل هو {formatPrice(minDelivery, currency)}. أضف
          المزيد من الأصناف للمتابعة.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting || cart.lines.length === 0 || belowMinimum}
        className={`${buttonPrimaryClassName()} w-full rounded-2xl py-3.5 text-base`}
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
      <label className={labelClassName()}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        dir={dir}
        inputMode={inputMode}
        placeholder={placeholder}
        className={inputClassName()}
      />
    </div>
  );
}
