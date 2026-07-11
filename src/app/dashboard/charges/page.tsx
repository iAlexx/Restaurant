import { requireAdminPage } from "@/lib/auth/admin-page";
import { listChargesForAdmin } from "@/lib/actions/charges";
import { ChargeForm, chargeValueLabel } from "@/components/dashboard/charge-form";
import { ChargeRowActions } from "@/components/dashboard/charge-row-actions";
import { Badge, EmptyState, PageHeader } from "@/components/dashboard/form-ui";
import { formatChargeDisplayLabel } from "@/lib/charges/calculate";

const APPLIES_LABELS = {
  ALL: "جميع الطلبات",
  DINE_IN: "داخل المطعم",
  DELIVERY: "توصيل",
  PICKUP: "استلام",
} as const;

export default async function ChargesPage() {
  await requireAdminPage();
  const charges = await listChargesForAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="الضرائب والرسوم"
        description="إدارة الرسوم الإضافية مثل الإعمار والضريبة ورسوم الخدمة — تُحسب تلقائياً على الخادم وتُطبع على الفاتورة."
      />

      <ChargeForm />

      {charges.length === 0 ? (
        <EmptyState
          title="لا توجد رسوم بعد"
          description="أضف رسوماً أو ضرائب لتطبق تلقائياً على الطلبات حسب نوعها."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-brand-border">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-brand-cream text-brand-muted">
                <tr>
                  <th className="px-4 py-2.5 text-start font-semibold">الاسم</th>
                  <th className="px-4 py-2.5 text-start font-semibold">النوع</th>
                  <th className="px-4 py-2.5 text-start font-semibold">القيمة</th>
                  <th className="px-4 py-2.5 text-start font-semibold">ينطبق على</th>
                  <th className="px-4 py-2.5 text-start font-semibold">الحالة</th>
                  <th className="px-4 py-2.5 text-start font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge) => (
                  <tr key={charge.id} className="border-t border-brand-border">
                    <td className="px-4 py-3 font-medium text-brand-chocolate">
                      {charge.name_ar}
                    </td>
                    <td className="px-4 py-3 text-brand-muted">
                      {charge.calculation_type === "PERCENTAGE"
                        ? "نسبة مئوية"
                        : "مبلغ ثابت"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-brand-chocolate">
                      {chargeValueLabel(charge, "ل.س")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="gold">{APPLIES_LABELS[charge.applies_to]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={charge.is_active ? "green" : "muted"}>
                        {charge.is_active ? "مفعّل" : "متوقف"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <ChargeRowActions charge={charge} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {charges.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-semibold text-brand-chocolate">تعديل الرسوم</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {charges.map((charge) => (
              <div key={charge.id} className="space-y-2">
                <p className="text-sm font-bold text-brand-chocolate">
                  {formatChargeDisplayLabel(
                    charge.name_ar,
                    charge.calculation_type,
                    charge.value
                  )}
                </p>
                <ChargeForm charge={charge} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
