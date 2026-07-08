import Link from "next/link";
import { fetchTableByToken } from "@/lib/menu/public-menu";
import { fetchOrderForWhatsApp } from "@/lib/orders/create-order";
import { InvalidTablePage } from "@/components/customer/dine-in-shell";
import { formatPrice } from "@/lib/money";

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
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-stone-600">الطلب غير موجود</p>
      </div>
    );
  }

  const order = data.order as {
    order_number: string;
    total: number;
    table_label_snapshot: string | null;
  };
  const currencyLabel = data.settings?.currency_label ?? "ل.س";

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
          ✓
        </div>
        <h1 className="text-xl font-bold text-stone-900">تم إرسال طلبك</h1>
        <p className="mt-2 text-stone-600">رقم الطلب</p>
        <p className="text-2xl font-bold text-amber-700">{order.order_number}</p>
        {order.table_label_snapshot ? (
          <p className="mt-2 text-sm text-stone-500">
            الطاولة: {order.table_label_snapshot}
          </p>
        ) : null}
        <p className="mt-4 text-lg font-semibold">
          {formatPrice(order.total, currencyLabel)}
        </p>
        <p className="mt-4 text-sm text-stone-600">
          سيتم تحضير طلبك قريباً. شكراً لك!
        </p>
        <Link
          href={`/t/${token}`}
          className="mt-6 inline-block text-amber-700 underline"
        >
          طلب المزيد
        </Link>
      </div>
    </div>
  );
}
