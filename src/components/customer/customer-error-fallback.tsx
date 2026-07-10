"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buttonPrimaryClassName } from "@/components/dashboard/form-ui";

export function CustomerErrorFallback({
  error,
  reset,
  menuHref = "/",
  title = "تعذر تحميل الصفحة",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  menuHref?: string;
  title?: string;
}) {
  useEffect(() => {
    console.error("Customer route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-brand-gold/40 bg-brand-surface p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange-soft text-2xl">
          ⚠️
        </div>
        <h1 className="text-xl font-extrabold text-brand-chocolate">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-muted">
          حدث خطأ أثناء تحميل الصفحة أو إرسال الطلب. تحقق من اتصال الإنترنت ثم
          أعد المحاولة.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" onClick={reset} className={buttonPrimaryClassName()}>
            إعادة المحاولة
          </button>
          <Link
            href={menuHref}
            className="rounded-xl border border-brand-gold/40 bg-brand-surface px-4 py-3 text-sm font-semibold text-brand-chocolate transition hover:bg-brand-gold-soft"
          >
            العودة إلى القائمة
          </Link>
        </div>
      </div>
    </div>
  );
}
