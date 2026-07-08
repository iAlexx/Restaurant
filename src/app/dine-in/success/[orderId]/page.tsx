import Link from "next/link";
import { fetchOrderForWhatsApp } from "@/lib/orders/create-order";
import { requireUnifiedDineInTable } from "@/lib/dine-in/resolve-table";
import { unifiedDineInHref } from "@/lib/dine-in/paths";
import { formatPrice } from "@/lib/money";

interface PageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ table?: string | string[] }>;
}

export default async function UnifiedDineInSuccessPage({
  params,
  searchParams,
}: PageProps) {
  const { orderId } = await params;
  const sp = await searchParams;
  const table = await requireUnifiedDineInTable(sp.table);

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
  const tableLabel = order.table_label_snapshot ?? table.label;

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
          ✓
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900">تم إرسال طلبك</h1>
        <p className="mt-4 text-sm text-stone-500">رقم الطلب</p>
        <p className="text-3xl font-extrabold tracking-tight text-amber-700">
          {order.order_number}
        </p>

        <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl bg-stone-50 py-4">
          <div className="text-center">
            <p className="text-xs text-stone-500">الطاولة</p>
            <p className="font-bold text-stone-900">{tableLabel}</p>
          </div>
          <span className="h-8 w-px bg-stone-200" />
          <div className="text-center">
            <p className="text-xs text-stone-500">الإجمالي</p>
            <p className="font-bold text-stone-900">
              {formatPrice(order.total, currencyLabel)}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">طلبك في المطبخ الآن 👨‍🍳</p>
          <p className="mt-1">سيتم تحضيره وتقديمه على طاولتك قريباً. شكراً لك!</p>
        </div>

        <Link
          href={unifiedDineInHref("menu", table.public_token)}
          className="mt-6 inline-flex rounded-xl border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          طلب المزيد
        </Link>
      </div>
    </div>
  );
}
