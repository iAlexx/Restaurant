import { requireAdminPage } from "@/lib/auth/admin-page";
import { listCategories, toggleCategoryActive } from "@/lib/actions/categories";
import { CategoryForm } from "@/components/dashboard/category-form";
import { ToggleActiveButton } from "@/components/dashboard/toggle-active-button";

export default async function CategoriesPage() {
  await requireAdminPage();
  const categories = await listCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">الأقسام</h1>
        <p className="mt-1 text-sm text-stone-600">إدارة أقسام قائمة الطعام</p>
      </div>

      <CategoryForm />

      <div className="overflow-x-auto rounded-xl border border-stone-200">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الاسم</th>
              <th className="px-4 py-3 text-start font-medium">الترتيب</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
              <th className="px-4 py-3 text-start font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-stone-500">
                  لا توجد أقسام بعد
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="border-t border-stone-100">
                  <td className="px-4 py-3">{category.name_ar}</td>
                  <td className="px-4 py-3">{category.sort_order}</td>
                  <td className="px-4 py-3">
                    {category.is_active ? "نشط" : "موقوف"}
                  </td>
                  <td className="px-4 py-3">
                    <ToggleActiveButton
                      isActive={category.is_active}
                      onToggle={(next) => toggleCategoryActive(category.id, next)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {categories.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-semibold text-stone-900">تعديل قسم</h2>
          {categories.map((category) => (
            <CategoryForm key={category.id} category={category} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
