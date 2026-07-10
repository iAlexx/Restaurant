import { requireAdminPage } from "@/lib/auth/admin-page";
import { listAddOns } from "@/lib/actions/add-ons";
import { AddOnForm } from "@/components/dashboard/add-on-form";
import { AddOnRowActions } from "@/components/dashboard/addon-row-actions";
import { Badge, EmptyState, PageHeader } from "@/components/dashboard/form-ui";
import { formatPrice } from "@/lib/money";

export default async function AddOnsPage() {
  await requireAdminPage();
  const addOns = await listAddOns();

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإضافات"
        description="إدارة الإضافات الاختيارية للمنتجات"
      />

      <AddOnForm />

      {addOns.length === 0 ? (
        <EmptyState
          title="لا توجد إضافات بعد"
          description="أضف إضافات مثل الجبنة أو الصلصات لربطها بالمنتجات."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-brand-border">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-brand-cream text-brand-muted">
                <tr>
                  <th className="px-4 py-2.5 text-start font-semibold">الاسم</th>
                  <th className="px-4 py-2.5 text-start font-semibold">
                    السعر الإضافي
                  </th>
                  <th className="px-4 py-2.5 text-start font-semibold">
                    الحالة
                  </th>
                  <th className="px-4 py-2.5 text-start font-semibold">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {addOns.map((addOn) => (
                  <tr key={addOn.id} className="border-t border-brand-border">
                    <td className="px-4 py-3 font-medium text-brand-chocolate">
                      {addOn.name_ar}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-brand-chocolate">
                      {formatPrice(addOn.extra_price)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={addOn.is_available ? "green" : "muted"}>
                        {addOn.is_available ? "متاح" : "غير متاح"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <AddOnRowActions
                        addOnId={addOn.id}
                        addOnName={addOn.name_ar}
                        isAvailable={addOn.is_available}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {addOns.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-semibold text-brand-chocolate">تعديل الإضافات</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {addOns.map((addOn) => (
              <AddOnForm key={addOn.id} addOn={addOn} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
