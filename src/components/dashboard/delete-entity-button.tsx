"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FormAlert,
  buttonDangerClassName,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-ui";
import type { ActionResult } from "@/lib/actions/types";
import type { DeletePreview } from "@/lib/admin/delete-policy";
import { isTypedConfirmationValid } from "@/lib/admin/delete-policy";

interface DeleteEntityButtonProps {
  entityId: string;
  entityName: string;
  previewAction: (id: string) => Promise<DeletePreview>;
  deleteAction: (id: string) => Promise<ActionResult>;
  compact?: boolean;
}

export function DeleteEntityButton({
  entityId,
  entityName,
  previewAction,
  deleteAction,
  compact = false,
}: DeleteEntityButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<DeletePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [typedValue, setTypedValue] = useState("");
  const [resultMessage, setResultMessage] = useState<ActionResult | null>(null);
  const [loadingPreview, startPreviewTransition] = useTransition();
  const [pending, startDeleteTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    setPreview(null);
    setPreviewError(null);
    setTypedValue("");
    setResultMessage(null);

    startPreviewTransition(async () => {
      try {
        const nextPreview = await previewAction(entityId);
        setPreview(nextPreview);
      } catch {
        setPreviewError("تعذر تحميل معلومات الحذف");
      }
    });
  }, [open, entityId, previewAction]);

  function handleClose() {
    if (pending) return;
    setOpen(false);
  }

  function handleConfirm() {
    if (!preview?.canDelete) return;

    if (
      preview.requireTypedConfirmation &&
      preview.typedConfirmationExpected &&
      !isTypedConfirmationValid(typedValue, preview.typedConfirmationExpected)
    ) {
      return;
    }

    startDeleteTransition(async () => {
      const result = await deleteAction(entityId);
      if (result.error) {
        setResultMessage(result);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  const typedOk =
    !preview?.requireTypedConfirmation ||
    !preview.typedConfirmationExpected ||
    isTypedConfirmationValid(typedValue, preview.typedConfirmationExpected);

  const descriptionParts = [
    preview?.blockReason,
    preview?.dependencyLines.length
      ? preview.dependencyLines.join("\n")
      : null,
    preview?.canDelete
      ? "لا يمكن التراجع عن هذا الإجراء."
      : null,
  ].filter(Boolean);

  return (
    <>
      <button
        type="button"
        className={
          compact
            ? "inline-flex min-h-[36px] items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-60"
            : buttonDangerClassName()
        }
        onClick={() => setOpen(true)}
      >
        حذف
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`حذف ${entityName}`}
          onClick={handleClose}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-brand-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-brand-chocolate">
              حذف «{preview?.entityName ?? entityName}»؟
            </h2>

            {loadingPreview ? (
              <p className="mt-3 text-sm text-brand-muted">جاري التحقق...</p>
            ) : null}

            {previewError ? (
              <p className="mt-3 text-sm text-red-700">{previewError}</p>
            ) : null}

            {preview && !loadingPreview ? (
              <>
                {descriptionParts.length > 0 ? (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-brand-muted">
                    {descriptionParts.join("\n\n")}
                  </p>
                ) : null}

                {preview.canDelete && preview.requireTypedConfirmation ? (
                  <div className="mt-4">
                    <label
                      className={labelClassName()}
                      htmlFor={`delete-confirm-${entityId}`}
                    >
                      {preview.typedConfirmationLabel}
                    </label>
                    <input
                      id={`delete-confirm-${entityId}`}
                      type="text"
                      value={typedValue}
                      onChange={(e) => setTypedValue(e.target.value)}
                      className={inputClassName()}
                      autoComplete="off"
                      disabled={pending}
                    />
                  </div>
                ) : null}

                <FormAlert message={resultMessage?.error} type="error" />
              </>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-brand-border bg-brand-surface px-4 py-2 text-sm font-medium text-brand-chocolate transition-colors hover:bg-brand-gold-soft disabled:opacity-60"
                onClick={handleClose}
                disabled={pending}
              >
                إلغاء
              </button>
              {preview?.canDelete ? (
                <button
                  type="button"
                  className={buttonDangerClassName()}
                  onClick={handleConfirm}
                  disabled={pending || loadingPreview || !typedOk}
                >
                  {pending ? "..." : "تأكيد الحذف"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
