import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { getTableById } from "@/lib/actions/tables";
import { getRestaurantSettings } from "@/lib/actions/settings";
import { QrCardActions } from "@/components/dashboard/qr-card-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TableQrCardPage({ params }: PageProps) {
  await requireAdminPage();
  const { id } = await params;

  const [table, settings] = await Promise.all([
    getTableById(id),
    getRestaurantSettings(),
  ]);

  if (!table) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-chocolate">بطاقة QR للطاولة</h1>
          <p className="mt-1 text-sm text-brand-muted">
            اطبع هذه البطاقة وضعها على الطاولة ليتمكن الزبون من مسح الرمز والطلب.
          </p>
        </div>
        <QrCardActions tableId={table.id} />
      </div>

      <div className="flex justify-center">
        <div className="print-area w-full max-w-sm">
          <div className="mx-auto flex flex-col items-center gap-5 rounded-3xl border border-brand-border bg-brand-surface px-8 py-10 text-center shadow-sm">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logo_url}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : null}

            <div>
              <p className="text-2xl font-extrabold tracking-tight text-brand-chocolate">
                {settings.name}
              </p>
              <p className="mt-2 inline-block rounded-full bg-brand-orange-soft px-4 py-1 text-base font-bold text-brand-orange">
                {table.label}
              </p>
            </div>

            <div className="rounded-2xl border-4 border-brand-chocolate p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/admin/tables/${table.id}/qr`}
                alt={`رمز QR للطاولة ${table.label}`}
                className="h-56 w-56"
                width={224}
                height={224}
              />
            </div>

            <div className="space-y-1">
              <p className="text-lg font-bold text-brand-chocolate">
                امسح الرمز للطلب
              </p>
              <p className="text-sm leading-relaxed text-brand-muted">
                وجّه كاميرا هاتفك نحو الرمز لعرض القائمة وإرسال طلبك مباشرة من
                طاولتك.
              </p>
            </div>

            {settings.phone ? (
              <p className="text-xs text-brand-muted" dir="ltr">
                {settings.phone}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
