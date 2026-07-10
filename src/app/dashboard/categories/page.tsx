import { requireAdminPage } from "@/lib/auth/admin-page";
import {
  listCategories,
} from "@/lib/actions/categories";
import { CategoryForm } from "@/components/dashboard/category-form";
import { CategoryRowActions } from "@/components/dashboard/category-row-actions";
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
        <div className="overflow-hidden rounded-xl border border-brand-border">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-brand-cream text-brand-muted">
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
                  <tr key={category.id} className="border-t border-brand-border">
                    <td className="px-4 py-3 font-medium text-brand-chocolate">
                      {category.name_ar}
                    </td>
                    <td className="px-4 py-3 text-brand-muted">
                      {category.sort_order}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={category.is_active ? "green" : "muted"}>
                        {category.is_active ? "نشط" : "موقوف"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <CategoryRowActions
                        categoryId={category.id}
                        categoryName={category.name_ar}
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
          <h2 className="font-semibold text-brand-chocolate">تعديل الأقسام</h2>
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
