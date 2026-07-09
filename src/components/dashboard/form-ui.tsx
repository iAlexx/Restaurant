import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/* Class helpers — brand tokens                                               */
/* -------------------------------------------------------------------------- */

export function inputClassName() {
  return "w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2.5 text-sm text-brand-chocolate placeholder:text-brand-muted focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20 disabled:cursor-not-allowed disabled:bg-brand-cream";
}

export function selectClassName() {
  return inputClassName();
}

export function labelClassName() {
  return "mb-1.5 block text-sm font-medium text-brand-chocolate";
}

export function buttonPrimaryClassName() {
  return "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-brand-orange px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-hover focus:outline-none focus:ring-2 focus:ring-brand-orange/30 disabled:cursor-not-allowed disabled:opacity-60";
}

export function buttonSecondaryClassName() {
  return "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-brand-border bg-brand-surface px-4 py-2 text-sm font-medium text-brand-chocolate transition-colors hover:bg-brand-gold-soft focus:outline-none focus:ring-2 focus:ring-brand-gold/40 disabled:cursor-not-allowed disabled:opacity-60";
}

export function buttonDangerClassName() {
  return "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60";
}

export function buttonWhatsAppClassName() {
  return "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-green px-4 py-3.5 text-base font-bold text-white transition-colors hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-brand-green/30 disabled:cursor-not-allowed disabled:opacity-60";
}

export function cardSurfaceClassName() {
  return "rounded-xl border border-brand-border bg-brand-surface shadow-sm";
}

/* -------------------------------------------------------------------------- */
/* Alerts                                                                     */
/* -------------------------------------------------------------------------- */

export function FormAlert({
  message,
  type,
}: {
  message?: string;
  type: "error" | "success";
}) {
  if (!message) return null;

  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-brand-green/30 bg-brand-green-soft text-brand-chocolate";

  return (
    <p
      className={`rounded-lg border px-3 py-2 text-sm ${styles}`}
      role="alert"
    >
      {message}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Page header                                                                */
/* -------------------------------------------------------------------------- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-brand-chocolate">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-brand-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${cardSurfaceClassName()} p-4 ${className}`}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Badge                                                                      */
/* -------------------------------------------------------------------------- */

export type BadgeTone =
  | "neutral"
  | "orange"
  | "gold"
  | "green"
  | "red"
  | "muted"
  | "urgent"
  | "preparing"
  | "dine_in"
  | "delivery"
  | "pickup"
  | "print_pending"
  | "print_ok"
  | "print_fail";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-brand-cream text-brand-chocolate ring-1 ring-brand-border",
  orange: "bg-brand-orange-soft text-brand-orange",
  gold: "bg-brand-gold-soft text-brand-chocolate ring-1 ring-brand-gold/50",
  green: "bg-brand-green-soft text-brand-chocolate",
  red: "bg-red-100 text-red-800",
  muted: "bg-brand-cream text-brand-muted ring-1 ring-brand-border",
  urgent: "bg-brand-orange text-white",
  preparing: "bg-brand-orange-soft text-brand-orange",
  dine_in: "bg-brand-gold-soft text-brand-chocolate ring-1 ring-brand-gold/40",
  delivery: "bg-brand-orange-soft text-brand-orange",
  pickup: "bg-brand-cream text-brand-chocolate ring-1 ring-brand-gold/50",
  print_pending: "bg-brand-gold-soft text-brand-chocolate",
  print_ok: "bg-brand-green-soft text-brand-chocolate",
  print_fail: "bg-red-100 text-red-800",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeTones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-gold/60 bg-brand-surface/80 px-6 py-12 text-center">
      {icon ? <div className="mb-3 text-brand-muted">{icon}</div> : null}
      <p className="font-semibold text-brand-chocolate">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-brand-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-brand-gold/25 ${className}`}
    />
  );
}
