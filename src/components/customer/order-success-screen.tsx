import type { ReactNode } from "react";
import type { OrderType } from "@/types/database";
import {
  OrderSummaryCard,
  type OrderSummaryLine,
} from "@/components/customer/order-summary-card";
import { customerContainerClassName } from "@/components/customer/customer-menu-shell";

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
    <div className="min-h-screen bg-brand-cream px-4 py-8 sm:py-12">
      <div
        className={`${customerContainerClassName} motion-fade-up max-w-2xl`}
      >
        <div className="text-center">
          <div className="motion-scale-in mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-brand-green-soft text-4xl font-bold text-brand-green ring-4 ring-brand-green/20">
            ✓
          </div>
          <h1 className="text-2xl font-extrabold text-brand-chocolate sm:text-3xl">
            {title}
          </h1>
        </div>

        <div className="mt-8 rounded-2xl border border-brand-gold/40 bg-brand-surface p-5 shadow-sm sm:p-8">
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
