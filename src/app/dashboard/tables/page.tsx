import { requireAdminPage } from "@/lib/auth/admin-page";
import { listTables, toggleTableActive } from "@/lib/actions/tables";
import { TableForm } from "@/components/dashboard/table-form";
import { TableQrActions } from "@/components/dashboard/table-qr-actions";
import { ToggleActiveButton } from "@/components/dashboard/toggle-active-button";
import { getSiteUrl } from "@/lib/env";

export default async function TablesPage() {
  await requireAdminPage();
  const tables = await listTables();
  const siteUrl = getSiteUrl();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">الطاولات</h1>
        <p className="mt-1 text-sm text-stone-600">
          إدارة الطاولات ورموز QR للطلب داخل المطعم
        </p>
      </div>

      <TableForm />

      <div className="overflow-x-auto rounded-xl border border-stone-200">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الطاولة</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
              <th className="px-4 py-3 text-start font-medium">رابط QR</th>
              <th className="px-4 py-3 text-start font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {tables.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-stone-500">
                  لا توجد طاولات بعد
                </td>
              </tr>
            ) : (
              tables.map((table) => (
                <tr key={table.id} className="border-t border-stone-100">
                  <td className="px-4 py-3 font-medium">{table.label}</td>
                  <td className="px-4 py-3">
                    {table.is_active ? "نشطة" : "موقوفة"}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-xs text-stone-500" dir="ltr">
                    {siteUrl}/t/{table.public_token.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <TableQrActions tableId={table.id} />
                      <ToggleActiveButton
                        isActive={table.is_active}
                        onToggle={(next) => toggleTableActive(table.id, next)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {tables.map((table) => (
        <TableForm key={table.id} table={table} />
      ))}
    </div>
  );
}
