import Link from "next/link";
import { fetchTableByToken } from "@/lib/menu/public-menu";
import { fetchOrderForWhatsApp } from "@/lib/orders/create-order";
import { InvalidTablePage } from "@/components/customer/dine-in-shell";
import { buildOrderSummaryLines } from "@/lib/orders/order-summary";
import { OrderSuccessScreen } from "@/components/customer/order-success-screen";
import { buttonSecondaryClassName } from "@/components/dashboard/form-ui";

interface PageProps {
  params: Promise<{ token: string; orderId: string }>;
}

export default async function DineInSuccessPage({ params }: PageProps) {
  const { token, orderId } = await params;
  const table = await fetchTableByToken(token);

  if (!table || !table.is_active) {
    return <InvalidTablePage />;
  }

  const data = await fetchOrderForWhatsApp(orderId);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4">
        <p className="text-brand-muted">الطلب غير موجود</p>
      </div>
    );
  }

  const order = data.order as {
    order_number: string;
    order_type: "DINE_IN";
    subtotal: number;
    delivery_fee: number;
    total: number;
    table_label_snapshot: string | null;
    notes: string | null;
  };
  const currencyLabel = data.settings?.currency_label ?? "ل.س";
  const tableLabel = order.table_label_snapshot ?? table.label;
  const lines = buildOrderSummaryLines(
    data.items as Parameters<typeof buildOrderSummaryLines>[0],
    data.addOns as Parameters<typeof buildOrderSummaryLines>[1]
  );

  return (
    <OrderSuccessScreen
      title="تم إرسال طلبك"
      currencyLabel={currencyLabel}
      orderNumber={order.order_number}
      orderType="DINE_IN"
      lines={lines}
      subtotal={order.subtotal}
      deliveryFee={order.delivery_fee}
      total={order.total}
      tableLabel={tableLabel}
      orderNotes={order.notes}
      footer={
        <Link
          href={`/t/${token}`}
          className={`${buttonSecondaryClassName()} w-full rounded-xl`}
        >
          طلب المزيد
        </Link>
      }
    >
      <div className="rounded-2xl border border-brand-gold/45 bg-brand-gold-soft px-4 py-3 text-sm text-brand-chocolate">
        <p className="font-semibold">طلبك في المطبخ الآن</p>
        <p className="mt-1">
          سيتم تحضيره وتقديمه على طاولتك قريباً. شكراً لك!
        </p>
      </div>
    </OrderSuccessScreen>
  );
}
