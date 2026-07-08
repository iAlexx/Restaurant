import { requireAdminPage } from "@/lib/auth/admin-page";
import { listCategories } from "@/lib/actions/categories";
import { listAddOns } from "@/lib/actions/add-ons";
import { listProducts, toggleProductAvailableForm } from "@/lib/actions/products";
import { ProductForm } from "@/components/dashboard/product-form";
import { ToggleActiveButton } from "@/components/dashboard/toggle-active-button";
import { Badge, EmptyState, PageHeader } from "@/components/dashboard/form-ui";
import { formatPrice } from "@/lib/money";

export default async function ProductsPage() {
  await requireAdminPage();
  const [categories, addOns, products] = await Promise.all([
    listCategories(),
    listAddOns(),
    listProducts(),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name_ar]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="المنتجات"
        description="إدارة منتجات القائمة والأسعار"
      />

      <ProductForm categories={categories} addOns={addOns} />

      {products.length === 0 ? (
        <EmptyState
          title="لا توجد منتجات بعد"
          description="أضف منتجاً وحدد قسمه وسعره ليظهر في قائمة الزبائن."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-2.5 text-start font-semibold">
                    المنتج
                  </th>
                  <th className="px-4 py-2.5 text-start font-semibold">القسم</th>
                  <th className="px-4 py-2.5 text-start font-semibold">السعر</th>
                  <th className="px-4 py-2.5 text-start font-semibold">
                    الحالة
                  </th>
                  <th className="px-4 py-2.5 text-start font-semibold">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-stone-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image_url}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-stone-300">
                            🍽
                          </div>
                        )}
                        <span className="font-medium text-stone-900">
                          {product.name_ar}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {categoryMap.get(product.category_id) ?? "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-stone-700">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={product.is_available ? "green" : "stone"}>
                        {product.is_available ? "متاح" : "غير متاح"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <ToggleActiveButton
                        action={toggleProductAvailableForm}
                        entityId={product.id}
                        isActive={product.is_available}
                        activeLabel="إيقاف"
                        inactiveLabel="تفعيل"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {products.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-semibold text-stone-900">تعديل المنتجات</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {products.map((product) => (
              <ProductForm
                key={product.id}
                categories={categories}
                addOns={addOns}
                product={product}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
