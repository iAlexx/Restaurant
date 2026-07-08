"use client";

import { useActionState } from "react";
import {
  createTable,
  updateTable,
} from "@/lib/actions/tables";
import type { ActionResult } from "@/lib/actions/types";
import {
  FormAlert,
  buttonPrimaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-ui";
import type { Table } from "@/types/database";

const initial: ActionResult = {};

export function TableForm({ table }: { table?: Table }) {
  const action = table ? updateTable.bind(null, table.id) : createTable;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-stone-200 p-4">
      <h2 className="font-semibold text-stone-900">
        {table ? "تعديل الطاولة" : "طاولة جديدة"}
      </h2>
      <FormAlert message={state.error} type="error" />
      <FormAlert message={state.success} type="success" />

      <div>
        <label className={labelClassName()} htmlFor={`label-${table?.id ?? "new"}`}>
          رقم أو اسم الطاولة
        </label>
        <input
          id={`label-${table?.id ?? "new"}`}
          name="label"
          required
          defaultValue={table?.label ?? ""}
          className={inputClassName()}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={table?.is_active ?? true}
        />
        نشطة
      </label>

      <button type="submit" disabled={pending} className={buttonPrimaryClassName()}>
        {pending ? "جاري الحفظ..." : table ? "تحديث" : "إضافة"}
      </button>
    </form>
  );
}
