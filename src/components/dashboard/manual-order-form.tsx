"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createManualOrderAction } from "@/lib/actions/orders";
import type { PublicMenu } from "@/lib/menu/public-menu";
import { formatPrice } from "@/lib/money";
import {
  FormAlert,
  buttonPrimaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-ui";

interface TableOption {
  id: string;
  label: string;
}

function newSubmitToken(): string {
  return crypto.randomUUID();
}

interface ManualCartLine {
  product_id: string;
  quantity: number;
  add_on_ids: string[];
  notes: string | null;
}

export function ManualOrderForm({
  menu,
  tables,
}: {
  menu: PublicMenu;
  tables: TableOption[];
}) {
  const router = useRouter();
  const [orderType, setOrderType] = useState<"DINE_IN" | "DELIVERY" | "PICKUP">(
    "DINE_IN"
  );
  const [lines, setLines] = useState<ManualCartLine[]>([]);
  const [submitToken, setSubmitToken] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [lineNotes, setLineNotes] = useState("");

  const [state, action, pending] = useActionState(createManualOrderAction, {});

  useEffect(() => {
    setSubmitToken(newSubmitToken());
  }, []);

  useEffect(() => {
    if (state.orderId && state.success) {
      router.push(`/dashboard/orders/${state.orderId}`);
    }
  }, [state.orderId, state.success, router]);

  const productsByCategory = useMemo(() => {
    const map = new Map<string, typeof menu.products>();
    for (const cat of menu.categories) {
      map.set(
        cat.id,
        menu.products.filter((p) => p.category_id === cat.id)
      );
    }
    return map;
  }, [menu]);

  const selectedProduct = menu.products.find((p) => p.id === selectedProductId);
  const availableAddOns = selectedProduct
    ? menu.addOns.filter((a) => selectedProduct.add_on_ids.includes(a.id))
    : [];

  const cartSubtotal = lines.reduce((sum, line) => {
    const product = menu.products.find((p) => p.id === line.product_id);
    if (!product) return sum;
    const addOnTotal = (line.add_on_ids ?? []).reduce((s, id) => {
      const addOn = menu.addOns.find((a) => a.id === id);
      return s + (addOn?.extra_price ?? 0);
    }, 0);
    return sum + (product.price + addOnTotal) * line.quantity;
  }, 0);

  function addLine() {
    if (!selectedProduct) return;
    setLines((prev) => [
      ...prev,
      {
        product_id: selectedProduct.id,
        quantity,
        add_on_ids: selectedAddOns,
        notes: lineNotes || null,
      },
    ]);
    setSelectedProductId(null);
    setQuantity(1);
    setSelectedAddOns([]);
    setLineNotes("");
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-stone-900">طلب يدوي</h1>

      <FormAlert message={state.error} type="error" />
      <FormAlert message={state.success} type="success" />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["DINE_IN", "داخل المطعم"],
            ["DELIVERY", "توصيل"],
            ["PICKUP", "استلام"],
          ] as const
        ).map(([type, label]) => (
          <button
            key={type}
            type="button"
            onClick={() => setOrderType(type)}
            className={`rounded-lg px-4 py-2 text-sm ${
              orderType === type
                ? "bg-amber-600 text-white"
                : "bg-stone-100 text-stone-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form action={action} className="space-y-6">
        <input type="hidden" name="order_type" value={orderType} />
        <input type="hidden" name="submit_token" value={submitToken} />
        <input type="hidden" name="items_json" value={JSON.stringify(lines)} />

        {orderType === "DINE_IN" && (
          <div>
            <label className={labelClassName()} htmlFor="table_id">
              الطاولة
            </label>
            <select
              id="table_id"
              name="table_id"
              required
              className={inputClassName()}
              defaultValue=""
            >
              <option value="" disabled>
                اختر طاولة
              </option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {orderType === "DELIVERY" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClassName()} htmlFor="customer_name">
                اسم العميل
              </label>
              <input
                id="customer_name"
                name="customer_name"
                required
                className={inputClassName()}
              />
            </div>
            <div>
              <label className={labelClassName()} htmlFor="customer_phone">
                الهاتف
              </label>
              <input
                id="customer_phone"
                name="customer_phone"
                required
                dir="ltr"
                className={inputClassName()}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClassName()} htmlFor="customer_address">
                العنوان
              </label>
              <input
                id="customer_address"
                name="customer_address"
                required
                className={inputClassName()}
              />
            </div>
            <div>
              <label className={labelClassName()} htmlFor="location_url">
                رابط الموقع (اختياري)
              </label>
              <input
                id="location_url"
                name="location_url"
                dir="ltr"
                className={inputClassName()}
              />
            </div>
            <div>
              <label className={labelClassName()} htmlFor="delivery_fee">
                رسوم التوصيل
              </label>
              <input
                id="delivery_fee"
                name="delivery_fee"
                type="number"
                min={0}
                required
                defaultValue={menu.settings.default_delivery_fee}
                className={inputClassName()}
              />
            </div>
          </div>
        )}

        {orderType === "PICKUP" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClassName()} htmlFor="customer_name">
                اسم العميل
              </label>
              <input
                id="customer_name"
                name="customer_name"
                required
                className={inputClassName()}
              />
            </div>
            <div>
              <label className={labelClassName()} htmlFor="customer_phone">
                الهاتف
              </label>
              <input
                id="customer_phone"
                name="customer_phone"
                required
                dir="ltr"
                className={inputClassName()}
              />
            </div>
            <div>
              <label className={labelClassName()} htmlFor="pickup_time">
                وقت الاستلام (اختياري)
              </label>
              <input
                id="pickup_time"
                name="pickup_time"
                className={inputClassName()}
              />
            </div>
          </div>
        )}

        <div>
          <label className={labelClassName()} htmlFor="notes">
            ملاحظات الطلب
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            className={inputClassName()}
          />
        </div>

        <section className="rounded-xl border border-stone-200 p-4">
          <h2 className="font-semibold">إضافة منتجات</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClassName()}>المنتج</label>
              <select
                value={selectedProductId ?? ""}
                onChange={(e) => {
                  setSelectedProductId(e.target.value || null);
                  setSelectedAddOns([]);
                }}
                className={inputClassName()}
              >
                <option value="">اختر منتجاً</option>
                {menu.categories.map((cat) => {
                  const products = productsByCategory.get(cat.id) ?? [];
                  if (products.length === 0) return null;
                  return (
                    <optgroup key={cat.id} label={cat.name_ar}>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name_ar} — {formatPrice(p.price, menu.settings.currency_label)}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>
            <div>
              <label className={labelClassName()}>الكمية</label>
              <input
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className={inputClassName()}
              />
            </div>
          </div>

          {availableAddOns.length > 0 && (
            <div className="mt-3">
              <p className={labelClassName()}>الإضافات</p>
              <div className="flex flex-wrap gap-2">
                {availableAddOns.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedAddOns.includes(a.id)}
                      onChange={(e) => {
                        setSelectedAddOns((prev) =>
                          e.target.checked
                            ? [...prev, a.id]
                            : prev.filter((id) => id !== a.id)
                        );
                      }}
                    />
                    {a.name_ar} (+{formatPrice(a.extra_price, menu.settings.currency_label)})
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3">
            <label className={labelClassName()}>ملاحظات الصنف</label>
            <input
              value={lineNotes}
              onChange={(e) => setLineNotes(e.target.value)}
              className={inputClassName()}
            />
          </div>

          <button
            type="button"
            onClick={addLine}
            disabled={!selectedProduct}
            className={`mt-3 ${buttonPrimaryClassName()}`}
          >
            إضافة للسلة
          </button>
        </section>

        <section className="rounded-xl border border-stone-200 p-4">
          <h2 className="font-semibold">السلة ({lines.length})</h2>
          {lines.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">أضف منتجاً واحداً على الأقل</p>
          ) : (
            <ul className="mt-3 divide-y divide-stone-100">
              {lines.map((line, index) => {
                const product = menu.products.find((p) => p.id === line.product_id);
                return (
                  <li
                    key={`${line.product_id}-${index}`}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span>
                      {product?.name_ar} × {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="text-red-600 hover:underline"
                    >
                      حذف
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-sm text-stone-600">
            المجموع التقريبي: {formatPrice(cartSubtotal, menu.settings.currency_label)}
          </p>
        </section>

        <button
          type="submit"
          disabled={pending || lines.length === 0}
          className={buttonPrimaryClassName()}
        >
          {pending ? "جاري الإنشاء..." : "إنشاء الطلب"}
        </button>
      </form>
    </div>
  );
}
