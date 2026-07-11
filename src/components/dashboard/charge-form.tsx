"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createCharge,
  updateCharge,
  type ActionResult,
} from "@/lib/actions/charges";
import {
  basisPointsToPercentLabel,
  formatChargeDisplayLabel,
} from "@/lib/charges/calculate";
import { dbChargeToFormValues } from "@/lib/validations/charges";
import type { RestaurantCharge } from "@/lib/charges/types";
import {
  FormAlert,
  buttonPrimaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-ui";

const initial: ActionResult = {};

const APPLIES_TO_OPTIONS = [
  { value: "ALL", label: "جميع الطلبات" },
  { value: "DINE_IN", label: "داخل المطعم" },
  { value: "DELIVERY", label: "توصيل" },
  { value: "PICKUP", label: "استلام" },
] as const;

export function ChargeForm({ charge }: { charge?: RestaurantCharge }) {
  const action = charge ? updateCharge : createCharge;
  const [state, formAction, pending] = useActionState(action, initial);
  const defaults = charge ? dbChargeToFormValues(charge) : null;
  const [calculationType, setCalculationType] = useState<
    "PERCENTAGE" | "FIXED"
  >(defaults?.calculation_type ?? "PERCENTAGE");

  const previewLabel = useMemo(() => {
    if (!charge) return null;
    return formatChargeDisplayLabel(
      charge.name_ar,
      charge.calculation_type,
      charge.value
    );
  }, [charge]);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-brand-border bg-brand-cream/40 p-4"
    >
      {charge ? <input type="hidden" name="id" value={charge.id} /> : null}
      <FormAlert message={state.error} type="error" />
      <FormAlert message={state.success} type="success" />

      <div>
        <label className={labelClassName()} htmlFor={`name_ar-${charge?.id ?? "new"}`}>
          اسم الرسم
        </label>
        <input
          id={`name_ar-${charge?.id ?? "new"}`}
          name="name_ar"
          required
          defaultValue={defaults?.name_ar ?? ""}
          className={inputClassName()}
          placeholder="مثال: إعمار"
        />
      </div>

      <div>
        <label className={labelClassName()} htmlFor={`calculation_type-${charge?.id ?? "new"}`}>
          النوع
        </label>
        <select
          id={`calculation_type-${charge?.id ?? "new"}`}
          name="calculation_type"
          value={calculationType}
          onChange={(e) =>
            setCalculationType(e.target.value as "PERCENTAGE" | "FIXED")
          }
          className={inputClassName()}
        >
          <option value="PERCENTAGE">نسبة مئوية</option>
          <option value="FIXED">مبلغ ثابت</option>
        </select>
      </div>

      {calculationType === "PERCENTAGE" ? (
        <div>
          <label
            className={labelClassName()}
            htmlFor={`percentage_input-${charge?.id ?? "new"}`}
          >
            النسبة (%)
          </label>
          <input
            id={`percentage_input-${charge?.id ?? "new"}`}
            name="percentage_input"
            type="number"
            min={0.1}
            max={100}
            step={0.1}
            required
            defaultValue={defaults?.percentage_input ?? ""}
            className={inputClassName()}
            placeholder="10"
          />
          {charge?.calculation_type === "PERCENTAGE" ? (
            <p className="mt-1 text-xs text-brand-muted">
              الحالي: {basisPointsToPercentLabel(charge.value)}%
            </p>
          ) : null}
        </div>
      ) : (
        <div>
          <label
            className={labelClassName()}
            htmlFor={`fixed_amount-${charge?.id ?? "new"}`}
          >
            القيمة (ل.س)
          </label>
          <input
            id={`fixed_amount-${charge?.id ?? "new"}`}
            name="fixed_amount"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={defaults?.fixed_amount ?? ""}
            className={inputClassName()}
            placeholder="500"
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClassName()} htmlFor={`applies_to-${charge?.id ?? "new"}`}>
            ينطبق على
          </label>
          <select
            id={`applies_to-${charge?.id ?? "new"}`}
            name="applies_to"
            defaultValue={defaults?.applies_to ?? "ALL"}
            className={inputClassName()}
          >
            {APPLIES_TO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClassName()} htmlFor={`sort_order-${charge?.id ?? "new"}`}>
            ترتيب العرض
          </label>
          <input
            id={`sort_order-${charge?.id ?? "new"}`}
            name="sort_order"
            type="number"
            min={0}
            step={1}
            defaultValue={defaults?.sort_order ?? 0}
            className={inputClassName()}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-brand-chocolate">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={defaults?.is_active ?? true}
          className="h-4 w-4 rounded border-brand-border text-brand-orange focus:ring-brand-orange"
        />
        مفعّل
      </label>

      {previewLabel ? (
        <p className="text-xs text-brand-muted">معاينة التسمية: {previewLabel}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className={`${buttonPrimaryClassName()} w-full sm:w-auto`}
      >
        {pending ? "جاري الحفظ..." : charge ? "حفظ التعديلات" : "إضافة الرسم"}
      </button>
    </form>
  );
}
