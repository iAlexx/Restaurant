"use client";

import Link from "next/link";

export function QrCardActions({ tableId }: { tableId: string }) {
  return (
    <div className="no-print flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
      >
        طباعة البطاقة
      </button>
      <a
        href={`/api/admin/tables/${tableId}/qr`}
        download
        className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
      >
        تحميل صورة QR
      </a>
      <Link
        href="/dashboard/tables"
        className="rounded-lg px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-800"
      >
        رجوع للطاولات
      </Link>
    </div>
  );
}
