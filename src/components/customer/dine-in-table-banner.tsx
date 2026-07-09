import type { DineInContext } from "@/lib/dine-in/paths";
import { ChangeTableLink } from "@/components/customer/change-table-link";
import { TableContextStrip } from "@/components/customer/table-context-strip";

export function DineInTableBanner({ ctx }: { ctx: DineInContext }) {
  return (
    <TableContextStrip
      label={`أنت تطلب للطاولة رقم ${ctx.tableLabel}`}
      action={
        ctx.flow === "unified" ? (
          <ChangeTableLink className="text-sm font-bold text-brand-orange underline-offset-2 hover:underline" />
        ) : undefined
      }
    />
  );
}
