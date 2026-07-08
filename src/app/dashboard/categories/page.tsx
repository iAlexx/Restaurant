import { requireAdminPage } from "@/lib/auth/admin-page";
import {
  listCategories,
  toggleCategoryActiveForm,
} from "@/lib/actions/categories";
import { CategoryForm } from "@/components/dashboard/category-form";
import { ToggleActiveButton } from "@/components/dashboard/toggle-active-button";
import {
  Badge,
  EmptyState,
  PageHeader,
} from "@/components/dashboard/form-ui";

export default async function CategoriesPage() {
  await requireAdminPage();
  const categories = await listCategories();

  return (
    <div className="space-y-6">
      <PageHeader title="الأقسام" description="إدارة أقسام قائمة الطعام" />

      <CategoryForm />

      {categories.length === 0 ? (
        <EmptyState
          title="لا توجد أقسام بعد"
          description="أضف أول قسم لتنظيم أصناف قائمتك."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-2.5 text-start font-semibold">الاسم</th>
                  <th className="px-4 py-2.5 text-start font-semibold">
                    الترتيب
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
                {categories.map((category) => (
                  <tr key={category.id} className="border-t border-stone-100">
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {category.name_ar}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {category.sort_order}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={category.is_active ? "green" : "stone"}>
                        {category.is_active ? "نشط" : "موقوف"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <ToggleActiveButton
                        action={toggleCategoryActiveForm}
                        entityId={category.id}
                        isActive={category.is_active}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {categories.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-semibold text-stone-900">تعديل الأقسام</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map((category) => (
              <CategoryForm key={category.id} category={category} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
