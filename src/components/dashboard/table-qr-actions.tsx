"use client";

import { useTransition } from "react";
import { regenerateTableToken } from "@/lib/actions/tables";
import { buttonSecondaryClassName } from "@/components/dashboard/form-ui";

export function TableQrActions({ tableId }: { tableId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`/api/admin/tables/${tableId}/qr`}
        className={buttonSecondaryClassName()}
        download
      >
        تحميل QR
      </a>
      <button
        type="button"
        disabled={pending}
        className={buttonSecondaryClassName()}
        onClick={() =>
          startTransition(async () => {
            await regenerateTableToken(tableId);
          })
        }
      >
        {pending ? "..." : "تجديد الرمز"}
      </button>
    </div>
  );
}
