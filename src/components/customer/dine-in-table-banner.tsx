import type { DineInContext } from "@/lib/dine-in/paths";
import { ChangeTableLink } from "@/components/customer/change-table-link";

export function DineInTableBanner({
  ctx,
}: {
  ctx: DineInContext;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
      <span className="flex min-w-0 items-center gap-2">
        <span>🍽</span>
        <span className="truncate">
          طاولة <strong>{ctx.tableLabel}</strong>
        </span>
      </span>
      {ctx.flow === "unified" ? (
        <ChangeTableLink className="shrink-0 text-xs font-semibold text-amber-800 underline" />
      ) : null}
    </div>
  );
}
