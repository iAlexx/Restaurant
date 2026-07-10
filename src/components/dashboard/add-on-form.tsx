"use client";

import { useActionState } from "react";
import {
  createAddOn,
  deleteAddOn,
  getAddOnDeletePreview,
  updateAddOn,
} from "@/lib/actions/add-ons";
import type { ActionResult } from "@/lib/actions/types";
import {
  FormAlert,
  buttonPrimaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-ui";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import type { AddOn } from "@/types/database";
import { formatPrice } from "@/lib/money";

const initial: ActionResult = {};

export function AddOnForm({ addOn }: { addOn?: AddOn }) {
  const action = addOn ? updateAddOn.bind(null, addOn.id) : createAddOn;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-brand-border bg-brand-surface p-4 shadow-sm">
      <h2 className="font-semibold text-brand-chocolate">
        {addOn ? "تعديل الإضافة" : "إضافة جديدة"}
      </h2>
      <FormAlert message={state.error} type="error" />
      <FormAlert message={state.success} type="success" />

      <div>
        <label className={labelClassName()} htmlFor={`name_ar-${addOn?.id ?? "new"}`}>
          اسم الإضافة
        </label>
        <input
          id={`name_ar-${addOn?.id ?? "new"}`}
          name="name_ar"
          required
          defaultValue={addOn?.name_ar ?? ""}
          className={inputClassName()}
        />
      </div>

      <div>
        <label className={labelClassName()} htmlFor={`extra_price-${addOn?.id ?? "new"}`}>
          السعر الإضافي (ل.س — عدد صحيح)
        </label>
        <input
          id={`extra_price-${addOn?.id ?? "new"}`}
          name="extra_price"
          type="number"
          min={0}
          step={1}
          required
          defaultValue={addOn?.extra_price ?? 0}
          className={inputClassName()}
        />
        {addOn ? (
          <p className="mt-1 text-xs text-brand-muted">
            مثال: {formatPrice(addOn.extra_price)}
          </p>
        ) : null}
      </div>

      <label className="flex items-center gap-2 text-sm text-brand-chocolate">
        <input
          type="checkbox"
          name="is_available"
          defaultChecked={addOn?.is_available ?? true}
        />
        متاح
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={buttonPrimaryClassName()}>
          {pending ? "جاري الحفظ..." : addOn ? "تحديث" : "إضافة"}
        </button>
        {addOn ? (
          <DeleteEntityButton
            entityId={addOn.id}
            entityName={addOn.name_ar}
            previewAction={getAddOnDeletePreview}
            deleteAction={deleteAddOn}
          />
        ) : null}
      </div>
    </form>
  );
}
