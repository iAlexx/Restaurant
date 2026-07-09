import type { ReactNode } from "react";
import type { OrderType } from "@/types/database";
import {
  OrderSummaryCard,
  type OrderSummaryLine,
} from "@/components/customer/order-summary-card";

interface OrderSuccessScreenProps {
  title: string;
  currencyLabel: string;
  orderNumber: string;
  orderType: OrderType;
  lines: OrderSummaryLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  tableLabel?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  orderNotes?: string | null;
  footer?: ReactNode;
  children?: ReactNode;
}

export function OrderSuccessScreen({
  title,
  currencyLabel,
  orderNumber,
  orderType,
  lines,
  subtotal,
  deliveryFee,
  total,
  tableLabel,
  customerName,
  customerPhone,
  orderNotes,
  footer,
  children,
}: OrderSuccessScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4 py-8">
      <div className="motion-fade-up w-full max-w-md rounded-3xl border border-brand-border bg-brand-surface p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <div className="motion-scale-in mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green-soft text-3xl text-brand-green ring-2 ring-brand-green/30">
            ✓
          </div>
          <h1 className="text-2xl font-extrabold text-brand-chocolate">{title}</h1>
        </div>

        <div className="mt-6">
          <OrderSummaryCard
            variant="success"
            currencyLabel={currencyLabel}
            orderNumber={orderNumber}
            orderType={orderType}
            lines={lines}
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            total={total}
            tableLabel={tableLabel}
            customerName={customerName}
            customerPhone={customerPhone}
            orderNotes={orderNotes}
          />
        </div>

        {children ? <div className="mt-6 space-y-3">{children}</div> : null}
        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  );
}
