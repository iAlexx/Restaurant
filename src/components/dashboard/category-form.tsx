"use client";

import { useActionState } from "react";
import {
  createCategory,
  updateCategory,
} from "@/lib/actions/categories";
import type { ActionResult } from "@/lib/actions/types";
import {
  FormAlert,
  buttonPrimaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-ui";
import type { Category } from "@/types/database";

const initial: ActionResult = {};

export function CategoryForm({ category }: { category?: Category }) {
  const action = category
    ? updateCategory.bind(null, category.id)
    : createCategory;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-brand-border bg-brand-surface p-4 shadow-sm">
      <h2 className="font-semibold text-brand-chocolate">
        {category ? "تعديل القسم" : "قسم جديد"}
      </h2>
      <FormAlert message={state.error} type="error" />
      <FormAlert message={state.success} type="success" />

      <div>
        <label className={labelClassName()} htmlFor="name_ar">اسم القسم</label>
        <input
          id="name_ar"
          name="name_ar"
          required
          defaultValue={category?.name_ar ?? ""}
          className={inputClassName()}
        />
      </div>

      <div>
        <label className={labelClassName()} htmlFor="sort_order">ترتيب العرض</label>
        <input
          id="sort_order"
          name="sort_order"
          type="number"
          min={0}
          defaultValue={category?.sort_order ?? 0}
          className={inputClassName()}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-brand-chocolate">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={category?.is_active ?? true}
        />
        نشط
      </label>

      <button type="submit" disabled={pending} className={buttonPrimaryClassName()}>
        {pending ? "جاري الحفظ..." : category ? "تحديث" : "إضافة"}
      </button>
    </form>
  );
}
