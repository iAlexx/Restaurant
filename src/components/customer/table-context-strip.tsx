import type { ReactNode } from "react";

interface TableContextStripProps {
  label: string;
  action?: ReactNode;
}

export function TableContextStrip({ label, action }: TableContextStripProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-brand-gold/35 bg-brand-surface px-4 py-2.5 shadow-sm">
      <p className="flex min-w-0 items-center gap-2 text-sm leading-relaxed text-brand-chocolate sm:text-[15px]">
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-brand-gold"
          aria-hidden="true"
        />
        <span>{label}</span>
      </p>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
