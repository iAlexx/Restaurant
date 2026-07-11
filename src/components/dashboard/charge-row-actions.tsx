"use client";

import { useTransition } from "react";
import {
  deleteCharge,
  toggleChargeActive,
} from "@/lib/actions/charges";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Badge, buttonSecondaryClassName } from "@/components/dashboard/form-ui";
import type { RestaurantCharge } from "@/lib/charges/types";
import { useState } from "react";

export function ChargeRowActions({
  charge,
}: {
  charge: RestaurantCharge;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", charge.id);
      formData.set("next", charge.is_active ? "false" : "true");
      const result = await toggleChargeActive({}, formData);
      if (result.error) setError(result.error);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCharge(charge.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setConfirmDelete(false);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={charge.is_active ? "green" : "muted"}>
        {charge.is_active ? "مفعّل" : "متوقف"}
      </Badge>
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className={buttonSecondaryClassName()}
      >
        {charge.is_active ? "إيقاف" : "تفعيل"}
      </button>
      <button
        type="button"
        onClick={() => setConfirmDelete(true)}
        disabled={pending}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        حذف
      </button>
      {error ? <p className="w-full text-xs text-red-600">{error}</p> : null}
      <ConfirmDialog
        open={confirmDelete}
        title="حذف الرسم"
        description={`هل تريد حذف «${charge.name_ar}»؟ الطلبات السابقة ستحتفظ بلقطاتها.`}
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        pending={pending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
