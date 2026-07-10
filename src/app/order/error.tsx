"use client";

import { CustomerErrorFallback } from "@/components/customer/customer-error-fallback";

export default function OrderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <CustomerErrorFallback error={error} reset={reset} menuHref="/order" />;
}
