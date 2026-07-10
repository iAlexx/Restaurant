"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, estimateCartTotal } from "@/contexts/cart-context";
import type { PublicMenu } from "@/lib/menu/public-menu";
import type { CreateOrderInput } from "@/lib/validations/order";
import { formatPrice } from "@/lib/money";
import {
  applyOrderSuccessSideEffects,
  planOrderSuccessNavigation,
  shouldRedirectEmptyCart,
} from "@/lib/checkout/success-navigation";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { OrderSummaryCard } from "@/components/customer/order-summary-card";
import { customerContainerClassName } from "@/components/customer/customer-menu-shell";
import {
  buttonPrimaryClassName,
  inputClassName,
  labelClassName,
  Skeleton,
} from "@/components/dashboard/form-ui";

const ORDER_SUBMIT_TIMEOUT_MS = 30_000;

interface CheckoutClientProps {
  menu: PublicMenu;
  orderType: "DINE_IN" | "DELIVERY" | "PICKUP";
  tableToken?: string;
  tableLabel?: string;
  successBasePath: string;
  unifiedSuccessPath?: (orderId: string) => string;
  emptyCartHref: string;
}

export function CheckoutClient({
  menu,
  orderType,
  tableToken,
  tableLabel,
  successBasePath,
  unifiedSuccessPath,
  emptyCartHref,
}: CheckoutClientProps) {
  const router = useRouter();
  const { cart, hydrated, getSubmitToken, clearCart, resetSubmitToken } =
    useCart();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isRedirectingToSuccess, setIsRedirectingToSuccess] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [orderNotes, setOrderNotes] = useState(cart.orderNotes);

  useEffect(() => {
    if (
      !shouldRedirectEmptyCart({
        hydrated,
        cartLineCount: cart.lines.length,
        isRedirectingToSuccess,
      })
    ) {
      return;
    }
    router.replace(emptyCartHref);
  }, [hydrated, cart.lines.length, isRedirectingToSuccess, router, emptyCartHref]);

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
      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        ORDER_SUBMIT_TIMEOUT_MS
      );

      let res: Response;
      try {
        res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeoutId);
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "تعذر إرسال الطلب");
        setSubmitting(false);
        return;
      }

      const plan = planOrderSuccessNavigation(data.id, {
        successBasePath,
        unifiedSuccessPath,
      });

      setIsRedirectingToSuccess(true);
      router.push(plan.successHref);
      applyOrderSuccessSideEffects(plan, { clearCart, resetSubmitToken });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setError(
          "استغرق إرسال الطلب وقتاً طويلاً. تحقق من الاتصال وأعد المحاولة — لم يتم إفراغ السلة."
        );
      } else {
        setError("تعذر الاتصال بالخادم. لم يتم إفراغ السلة — يمكنك إعادة المحاولة.");
      }
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

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (cart.lines.length === 0 && !isRedirectingToSuccess) {
    return null;
  }

  if (isRedirectingToSuccess) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <p className="text-center text-sm font-medium text-brand-muted">
          تم إرسال طلبك بنجاح — جاري فتح صفحة التأكيد...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pb-32 lg:pb-8">
      {error ? (
        <p
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="space-y-5 lg:col-span-3">
          {orderType === "DINE_IN" ? (
            <section className="rounded-2xl border border-brand-gold/40 bg-brand-surface p-5 shadow-sm">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-orange">
                الخطوة ١
              </p>
              <h2 className="text-lg font-extrabold text-brand-chocolate">
                تأكيد الطاولة
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                سيتم إرسال الطلب إلى طاولتك مباشرة. لا حاجة لإدخال بيانات
                إضافية.
              </p>
              {tableLabel ? (
                <p className="mt-3 rounded-xl border border-brand-gold/40 bg-brand-gold-soft px-4 py-3 text-base font-bold text-brand-chocolate">
                  الطاولة المختارة: {tableLabel}
                </p>
              ) : null}
            </section>
          ) : (
            <section className="rounded-2xl border border-brand-gold/40 bg-brand-surface p-5 shadow-sm sm:p-6">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-orange">
                الخطوة ١
              </p>
              <h2 className="text-lg font-extrabold text-brand-chocolate">
                بيانات العميل
              </h2>
              <div className="mt-5 space-y-4">
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
            </section>
          )}

          <section className="rounded-2xl border border-brand-gold/40 bg-brand-surface p-5 shadow-sm sm:p-6">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-orange">
              {orderType === "DINE_IN" ? "الخطوة ٢" : "الخطوة ٢"}
            </p>
            <h2 className="text-lg font-extrabold text-brand-chocolate">
              ملاحظات الطلب
            </h2>
            <textarea
              id="order-notes"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="أي تعليمات خاصة بالطلب"
              className={`${inputClassName()} mt-4 text-base`}
            />
          </section>
        </div>

        <div className="lg:col-span-2">
          <section className="rounded-2xl border border-brand-gold/40 bg-brand-surface p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-orange">
              {orderType === "DINE_IN" ? "الخطوة ٣" : "الخطوة ٣"}
            </p>
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
              customerPhone={
                orderType !== "DINE_IN" ? customerPhone || null : null
              }
              orderNotes={orderNotes || null}
            />

            {belowMinimum ? (
              <p className="mt-4 rounded-xl border border-brand-gold/50 bg-brand-gold-soft px-4 py-3 text-sm text-brand-chocolate">
                الحد الأدنى لطلب التوصيل هو {formatPrice(minDelivery, currency)}
                . أضف المزيد من الأصناف للمتابعة.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting || cart.lines.length === 0 || belowMinimum}
              className={`${buttonPrimaryClassName()} mt-5 hidden w-full rounded-2xl py-4 text-base font-bold lg:block`}
            >
              {submitting ? "جاري الإرسال..." : "تأكيد الطلب"}
            </button>
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-brand-gold/40 bg-brand-surface/95 backdrop-blur lg:hidden">
        <div
          className={`${customerContainerClassName} flex items-center gap-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]`}
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs text-brand-muted">الإجمالي</p>
            <p className="text-xl font-extrabold tabular-nums text-brand-orange">
              {formatPrice(total, currency)}
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting || cart.lines.length === 0 || belowMinimum}
            className={`${buttonPrimaryClassName()} min-h-[48px] shrink-0 rounded-2xl px-6 py-3 text-base font-bold`}
          >
            {submitting ? "جاري الإرسال..." : "تأكيد الطلب"}
          </button>
        </div>
      </div>

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
        className={`${inputClassName()} py-3 text-base`}
      />
    </div>
  );
}
