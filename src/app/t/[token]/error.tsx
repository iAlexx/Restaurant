"use client";

import { CustomerErrorFallback } from "@/components/customer/customer-error-fallback";

export default function LegacyTableError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <CustomerErrorFallback
      error={error}
      reset={reset}
      menuHref="/dine-in"
      title="تعذر تحميل قائمة الطاولة"
    />
  );
}
