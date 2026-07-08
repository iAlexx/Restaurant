import { requireAdminPage } from "@/lib/auth/admin-page";
import { listAddOns, toggleAddOnAvailableForm } from "@/lib/actions/add-ons";
import { AddOnForm } from "@/components/dashboard/add-on-form";
import { ToggleActiveButton } from "@/components/dashboard/toggle-active-button";
import { formatPrice } from "@/lib/money";

export default async function AddOnsPage() {
  await requireAdminPage();
  const addOns = await listAddOns();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">الإضافات</h1>
        <p className="mt-1 text-sm text-stone-600">إدارة الإضافات الاختيارية للمنتجات</p>
      </div>

      <AddOnForm />

      <div className="overflow-x-auto rounded-xl border border-stone-200">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الاسم</th>
              <th className="px-4 py-3 text-start font-medium">السعر الإضافي</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
              <th className="px-4 py-3 text-start font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {addOns.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-stone-500">
                  لا توجد إضافات بعد
                </td>
              </tr>
            ) : (
              addOns.map((addOn) => (
                <tr key={addOn.id} className="border-t border-stone-100">
                  <td className="px-4 py-3">{addOn.name_ar}</td>
                  <td className="px-4 py-3">{formatPrice(addOn.extra_price)}</td>
                  <td className="px-4 py-3">
                    {addOn.is_available ? "متاح" : "غير متاح"}
                  </td>
                  <td className="px-4 py-3">
                    <ToggleActiveButton
                      action={toggleAddOnAvailableForm}
                      entityId={addOn.id}
                      isActive={addOn.is_available}
                      activeLabel="إيقاف"
                      inactiveLabel="تفعيل"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {addOns.map((addOn) => (
        <AddOnForm key={addOn.id} addOn={addOn} />
      ))}
    </div>
  );
}
