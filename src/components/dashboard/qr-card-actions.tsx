"use client";

import Link from "next/link";

export function QrCardActions({ tableId }: { tableId: string }) {
  return (
    <div className="no-print flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-medium text-white hover:bg-brand-orange-hover"
      >
        طباعة البطاقة
      </button>
      <a
        href={`/api/admin/tables/${tableId}/qr`}
        download
        className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-chocolate hover:bg-brand-cream"
      >
        تحميل صورة QR
      </a>
      <Link
        href="/dashboard/tables"
        className="rounded-lg px-4 py-2 text-sm font-medium text-brand-muted hover:text-brand-chocolate"
      >
        رجوع للطاولات
      </Link>
    </div>
  );
}
