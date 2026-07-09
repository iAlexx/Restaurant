import type { DineInContext } from "@/lib/dine-in/paths";
import { ChangeTableLink } from "@/components/customer/change-table-link";

export function DineInTableBanner({
  ctx,
}: {
  ctx: DineInContext;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-brand-gold/45 bg-brand-gold-soft px-4 py-2.5 text-sm text-brand-chocolate">
      <span className="flex min-w-0 items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-brand-gold" />
        <span className="truncate">
          طاولة <strong>{ctx.tableLabel}</strong>
        </span>
      </span>
      {ctx.flow === "unified" ? (
        <ChangeTableLink className="shrink-0 text-xs font-semibold text-brand-orange underline" />
      ) : null}
    </div>
  );
}
