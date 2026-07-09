import Link from "next/link";
import { fetchOrderForWhatsApp } from "@/lib/orders/create-order";
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp/message";
import { buildOrderSummaryLines } from "@/lib/orders/order-summary";
import { OrderSuccessScreen } from "@/components/customer/order-success-screen";
import { buttonWhatsAppClassName } from "@/components/dashboard/form-ui";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function ExternalSuccessPage({ params }: PageProps) {
  const { orderId } = await params;
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
    order_type: "DELIVERY" | "PICKUP";
    customer_name: string | null;
    customer_phone: string | null;
    customer_address: string | null;
    location_url: string | null;
    pickup_time: string | null;
    table_label_snapshot: string | null;
    subtotal: number;
    delivery_fee: number;
    total: number;
    notes: string | null;
  };

  const currencyLabel = data.settings?.currency_label ?? "ل.س";
  const whatsappPhone = data.settings?.whatsapp_phone;
  const lines = buildOrderSummaryLines(
    data.items as Parameters<typeof buildOrderSummaryLines>[0],
    data.addOns as Parameters<typeof buildOrderSummaryLines>[1]
  );

  const message = buildWhatsAppMessage(
    order,
    data.items as Parameters<typeof buildWhatsAppMessage>[1],
    data.addOns as Parameters<typeof buildWhatsAppMessage>[2],
    currencyLabel
  );

  const whatsappUrl = whatsappPhone
    ? buildWhatsAppUrl(whatsappPhone, message)
    : null;

  return (
    <OrderSuccessScreen
      title="تم إنشاء طلبك"
      currencyLabel={currencyLabel}
      orderNumber={order.order_number}
      orderType={order.order_type}
      lines={lines}
      subtotal={order.subtotal}
      deliveryFee={order.delivery_fee}
      total={order.total}
      customerName={order.customer_name}
      customerPhone={order.customer_phone}
      orderNotes={order.notes}
    >
      <div className="rounded-2xl border border-brand-gold/45 bg-brand-gold-soft p-4">
        <p className="text-sm font-bold text-brand-chocolate">
          خطوة أخيرة لتأكيد الطلب
        </p>
        <p className="mt-1 text-sm text-brand-muted">
          اضغط الزر أدناه لإرسال تفاصيل طلبك عبر واتساب. لن يبدأ التحضير قبل
          التأكيد.
        </p>
      </div>

      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonWhatsAppClassName()}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.01c-.24.68-1.4 1.3-1.94 1.35-.5.05-1.13.24-3.68-.77-3.1-1.22-5.08-4.38-5.24-4.58-.15-.2-1.25-1.66-1.25-3.17 0-1.51.79-2.25 1.07-2.56.28-.31.61-.38.81-.38.2 0 .41 0 .58.01.19.01.44-.07.69.53.24.6.83 2.07.9 2.22.07.15.12.32.02.52-.1.2-.15.32-.29.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.37 1.46.3.15.47.12.65-.07.18-.2.75-.87.95-1.17.2-.3.4-.25.68-.15.28.1 1.75.83 2.05.98.3.15.5.22.58.35.07.13.07.73-.17 1.41z" />
          </svg>
          فتح واتساب وإرسال الطلب
        </a>
      ) : (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-600">
          رقم واتساب المطعم غير مُعد. تواصل مع المطعم مباشرة.
        </p>
      )}

      <Link
        href="/order"
        className="block text-center text-sm font-medium text-brand-muted hover:text-brand-chocolate"
      >
        طلب جديد
      </Link>
    </OrderSuccessScreen>
  );
}
