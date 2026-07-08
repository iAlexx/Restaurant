import { requireAdminPage } from "@/lib/auth/admin-page";
import { listTables, toggleTableActiveForm } from "@/lib/actions/tables";
import { TableForm } from "@/components/dashboard/table-form";
import { TableQrActions } from "@/components/dashboard/table-qr-actions";
import { ToggleActiveButton } from "@/components/dashboard/toggle-active-button";
import { Badge, EmptyState, PageHeader, buttonPrimaryClassName } from "@/components/dashboard/form-ui";
import { buildDineInUrl, getSiteUrl } from "@/lib/env";
import Link from "next/link";

export default async function TablesPage() {
  await requireAdminPage();
  const tables = await listTables();
  const siteUrl = getSiteUrl();
  const dineInUrl = buildDineInUrl();

  return (
    <div className="space-y-6">
      <PageHeader
        title="الطاولات"
        description="إدارة الطاولات ورموز QR للطلب داخل المطعم"
        actions={
          <Link
            href="/dashboard/tables/unified-qr-card"
            className={buttonPrimaryClassName()}
          >
            بطاقة QR موحّدة
          </Link>
        }
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-semibold">الرابط الموحّد للطلب داخل المطعم</p>
        <p className="mt-1" dir="ltr">
          {dineInUrl}
        </p>
        <p className="mt-1 text-xs text-amber-800">
          رمز QR واحد للمطعم — الزبون يختار الطاولة بعد المسح. رموز الطاولات
          الفردية ما زالت متاحة كاحتياط.
        </p>
      </div>

      <TableForm />

      {tables.length === 0 ? (
        <EmptyState
          title="لا توجد طاولات بعد"
          description="أضف طاولة لإنشاء رمز QR خاص بها يمكن للزبائن مسحه."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-2.5 text-start font-semibold">
                    الطاولة
                  </th>
                  <th className="px-4 py-2.5 text-start font-semibold">
                    الحالة
                  </th>
                  <th className="px-4 py-2.5 text-start font-semibold">
                    رابط QR
                  </th>
                  <th className="px-4 py-2.5 text-start font-semibold">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {tables.map((table) => (
                  <tr key={table.id} className="border-t border-stone-100">
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {table.label}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={table.is_active ? "green" : "stone"}>
                        {table.is_active ? "نشطة" : "موقوفة"}
                      </Badge>
                    </td>
                    <td
                      className="max-w-xs truncate px-4 py-3 text-xs text-stone-400"
                      dir="ltr"
                    >
                      {siteUrl}/t/{table.public_token.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <TableQrActions tableId={table.id} />
                        <ToggleActiveButton
                          action={toggleTableActiveForm}
                          entityId={table.id}
                          isActive={table.is_active}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tables.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-semibold text-stone-900">تعديل الطاولات</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {tables.map((table) => (
              <TableForm key={table.id} table={table} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
