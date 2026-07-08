import Link from "next/link";
import { fetchOrderForWhatsApp } from "@/lib/orders/create-order";
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp/message";
import { formatPrice } from "@/lib/money";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function ExternalSuccessPage({ params }: PageProps) {
  const { orderId } = await params;
  const data = await fetchOrderForWhatsApp(orderId);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-stone-600">الطلب غير موجود</p>
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
    notes: string | null;
    subtotal: number;
    delivery_fee: number;
    total: number;
    table_label_snapshot: string | null;
  };

  const currencyLabel = data.settings?.currency_label ?? "ل.س";
  const whatsappPhone = data.settings?.whatsapp_phone;

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
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
            ✓
          </div>
          <h1 className="text-xl font-bold text-stone-900">تم إنشاء طلبك</h1>
          <p className="mt-2 text-stone-600">رقم الطلب</p>
          <p className="text-2xl font-bold text-amber-700">{order.order_number}</p>
          <p className="mt-4 text-lg font-semibold">
            {formatPrice(order.total, currencyLabel)}
          </p>
        </div>

        <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          تم إنشاء طلبك. اضغط إرسال في واتساب لتأكيد الطلب مع المطعم.
        </div>

        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block w-full rounded-xl bg-green-600 py-3 text-center font-medium text-white"
          >
            فتح واتساب وإرسال الطلب
          </a>
        ) : (
          <p className="mt-4 text-center text-sm text-red-600">
            رقم واتساب المطعم غير مُعد. تواصل مع المطعم مباشرة.
          </p>
        )}

        <Link
          href="/order"
          className="mt-4 block text-center text-sm text-stone-500 underline"
        >
          طلب جديد
        </Link>
      </div>
    </div>
  );
}
