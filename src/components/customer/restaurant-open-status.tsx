import type { RestaurantOpenStatus } from "@/lib/hours/types";
import { formatClosingSoonMinutes } from "@/lib/hours/format-ar";

type RestaurantOpenStatusVariant = "badge" | "banner" | "compact";

const stateStyles = {
  open: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  closing_soon: {
    badge: "border-amber-200 bg-amber-50 text-amber-900",
    dot: "bg-amber-500",
  },
  closed: {
    badge: "border-brand-chocolate/20 bg-brand-cream text-brand-chocolate",
    dot: "bg-brand-chocolate/60",
  },
} as const;

export function RestaurantOpenStatus({
  status,
  variant = "badge",
  className = "",
}: {
  status: RestaurantOpenStatus;
  variant?: RestaurantOpenStatusVariant;
  className?: string;
}) {
  const styles = stateStyles[status.state];

  if (variant === "badge") {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${styles.badge} ${className}`}
        role="status"
        aria-live="polite"
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${styles.dot}`} aria-hidden />
        <span>{status.badgeLabel}</span>
      </div>
    );
  }

  if (variant === "compact") {
    if (status.isOpen) {
      return (
        <div className={`space-y-1 ${className}`} role="status" aria-live="polite">
          <RestaurantOpenStatus status={status} variant="badge" />
          {status.closesAtLabel ? (
            <p className="text-xs text-brand-muted">{status.closesAtLabel}</p>
          ) : null}
          {status.closingSoonMinutes !== null ? (
            <p className="text-xs font-medium text-amber-800">
              متبقٍ {formatClosingSoonMinutes(status.closingSoonMinutes)}
            </p>
          ) : null}
        </div>
      );
    }

    return (
      <div
        className={`rounded-xl border border-brand-chocolate/15 bg-brand-surface px-4 py-3 text-sm ${className}`}
        role="status"
        aria-live="polite"
      >
        <p className="font-bold text-brand-chocolate">{status.closedTitle}</p>
        {status.nextOpeningLabel ? (
          <p className="mt-1 text-brand-muted">{status.nextOpeningLabel}</p>
        ) : null}
        {status.closureMessage ? (
          <p className="mt-2 text-brand-muted">{status.closureMessage}</p>
        ) : null}
      </div>
    );
  }

  if (status.isOpen) {
    return (
      <div
        className={`rounded-2xl border border-emerald-200/80 bg-brand-surface px-4 py-3 shadow-sm ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center gap-3">
          <RestaurantOpenStatus status={status} variant="badge" />
          {status.closesAtLabel ? (
            <p className="text-sm text-brand-muted">{status.closesAtLabel}</p>
          ) : null}
        </div>
        {status.closingSoonMinutes !== null ? (
          <p className="mt-2 text-sm font-medium text-amber-800">
            {status.badgeLabel} — متبقٍ{" "}
            {formatClosingSoonMinutes(status.closingSoonMinutes)}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-brand-chocolate/20 bg-brand-surface px-4 py-4 shadow-sm ${className}`}
      role="status"
      aria-live="polite"
    >
      <p className="text-base font-extrabold text-brand-chocolate">
        {status.closedTitle}
      </p>
      {status.nextOpeningLabel ? (
        <p className="mt-2 text-sm text-brand-muted">{status.nextOpeningLabel}</p>
      ) : null}
      {status.closureMessage ? (
        <p className="mt-2 text-sm leading-relaxed text-brand-muted">
          {status.closureMessage}
        </p>
      ) : null}
    </div>
  );
}

export function RestaurantClosedCheckoutNotice({
  status,
}: {
  status: RestaurantOpenStatus;
}) {
  if (status.isAcceptingCustomerOrders) return null;

  return (
    <div
      className="mb-5 rounded-xl border border-brand-chocolate/20 bg-brand-cream px-4 py-3 text-sm text-brand-chocolate"
      role="alert"
    >
      <p className="font-bold">{status.closedTitle ?? "المطعم مغلق حالياً"}</p>
      {status.nextOpeningLabel ? (
        <p className="mt-1 text-brand-muted">{status.nextOpeningLabel}</p>
      ) : null}
      {status.closureMessage ? (
        <p className="mt-2 text-brand-muted">{status.closureMessage}</p>
      ) : null}
      <p className="mt-3 font-medium">
        يمكنك تصفح القائمة وإضافة الأصناف للسلة، لكن إرسال الطلب متوقف حالياً.
      </p>
    </div>
  );
}
