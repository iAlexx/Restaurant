"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { regenerateTableToken } from "@/lib/actions/tables";
import { buttonSecondaryClassName } from "@/components/dashboard/form-ui";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

export function TableQrActions({ tableId }: { tableId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/dashboard/tables/${tableId}/qr-card`}
        className={buttonSecondaryClassName()}
      >
        بطاقة QR
      </Link>
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
        onClick={() => setConfirmOpen(true)}
      >
        {pending ? "..." : "تجديد الرمز"}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="تجديد رمز QR؟"
        description="سيتوقف رمز QR الحالي عن العمل فوراً، وستحتاج لطباعة البطاقة من جديد. هل تريد المتابعة؟"
        confirmLabel="تجديد الرمز"
        tone="danger"
        pending={pending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          startTransition(async () => {
            await regenerateTableToken(tableId);
          });
        }}
      />
    </div>
  );
}
