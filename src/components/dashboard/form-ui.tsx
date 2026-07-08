import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/* Class helpers                                                              */
/* -------------------------------------------------------------------------- */

export function inputClassName() {
  return "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-stone-50";
}

export function selectClassName() {
  return inputClassName();
}

export function labelClassName() {
  return "mb-1.5 block text-sm font-medium text-stone-700";
}

export function buttonPrimaryClassName() {
  return "inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-60";
}

export function buttonSecondaryClassName() {
  return "inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-200 disabled:cursor-not-allowed disabled:opacity-60";
}

export function buttonDangerClassName() {
  return "inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60";
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
      : "border-green-200 bg-green-50 text-green-700";

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
        <h1 className="text-xl font-bold text-stone-900">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-stone-600">{description}</p>
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
    <div
      className={`rounded-xl border border-stone-200 bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Badge                                                                      */
/* -------------------------------------------------------------------------- */

export type BadgeTone =
  | "neutral"
  | "amber"
  | "blue"
  | "teal"
  | "orange"
  | "green"
  | "red"
  | "stone";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-stone-100 text-stone-700",
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-blue-100 text-blue-800",
  teal: "bg-teal-100 text-teal-800",
  orange: "bg-orange-100 text-orange-800",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  stone: "bg-stone-200 text-stone-700",
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50/60 px-6 py-12 text-center">
      {icon ? <div className="mb-3 text-stone-400">{icon}</div> : null}
      <p className="font-semibold text-stone-800">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-stone-500">{description}</p>
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
    <div className={`animate-pulse rounded-md bg-stone-200/70 ${className}`} />
  );
}
