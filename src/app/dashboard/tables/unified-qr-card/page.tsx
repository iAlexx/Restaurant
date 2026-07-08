import { requireAdminPage } from "@/lib/auth/admin-page";
import { getRestaurantSettings } from "@/lib/actions/settings";
import { buildDineInUrl } from "@/lib/env";
import { UnifiedQrCardActions } from "@/components/dashboard/unified-qr-card-actions";

export default async function UnifiedQrCardPage() {
  await requireAdminPage();
  const settings = await getRestaurantSettings();
  const dineInUrl = buildDineInUrl();

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900">
            بطاقة QR موحّدة للمطعم
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            رمز واحد على مدخل المطعم أو على كل طاولة — الزبون يختار رقم طاولته
            بعد المسح.
          </p>
          <p className="mt-2 text-xs text-stone-400" dir="ltr">
            {dineInUrl}
          </p>
        </div>
        <UnifiedQrCardActions />
      </div>

      <div className="flex justify-center">
        <div className="print-area w-full max-w-sm">
          <div className="mx-auto flex flex-col items-center gap-5 rounded-3xl border border-stone-200 bg-white px-8 py-10 text-center shadow-sm">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logo_url}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : null}

            <div>
              <p className="text-2xl font-extrabold tracking-tight text-stone-900">
                {settings.name}
              </p>
              <p className="mt-2 text-sm font-medium text-amber-800">
                طلب من الطاولة
              </p>
            </div>

            <div className="rounded-2xl border-4 border-stone-900 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/api/admin/dine-in/qr"
                alt="رمز QR للطلب داخل المطعم"
                className="h-56 w-56"
                width={224}
                height={224}
              />
            </div>

            <div className="space-y-1">
              <p className="text-lg font-bold text-stone-900">
                امسح الرمز واختر طاولتك
              </p>
              <p className="text-sm leading-relaxed text-stone-600">
                وجّه كاميرا هاتفك نحو الرمز، اختر رقم طاولتك، ثم تصفّح القائمة
                وأرسل طلبك.
              </p>
            </div>

            {settings.phone ? (
              <p className="text-xs text-stone-400" dir="ltr">
                {settings.phone}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
