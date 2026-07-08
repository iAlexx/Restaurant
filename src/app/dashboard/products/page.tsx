import { requireAdminPage } from "@/lib/auth/admin-page";
import { listCategories } from "@/lib/actions/categories";
import { listAddOns } from "@/lib/actions/add-ons";
import { listProducts, toggleProductAvailableForm } from "@/lib/actions/products";
import { ProductForm } from "@/components/dashboard/product-form";
import { ToggleActiveButton } from "@/components/dashboard/toggle-active-button";
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
      <div>
        <h1 className="text-xl font-bold text-stone-900">المنتجات</h1>
        <p className="mt-1 text-sm text-stone-600">إدارة منتجات القائمة والأسعار</p>
      </div>

      <ProductForm categories={categories} addOns={addOns} />

      <div className="overflow-x-auto rounded-xl border border-stone-200">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">المنتج</th>
              <th className="px-4 py-3 text-start font-medium">القسم</th>
              <th className="px-4 py-3 text-start font-medium">السعر</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
              <th className="px-4 py-3 text-start font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-stone-500">
                  لا توجد منتجات بعد
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-t border-stone-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url}
                          alt=""
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : null}
                      <span>{product.name_ar}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {categoryMap.get(product.category_id) ?? "—"}
                  </td>
                  <td className="px-4 py-3">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3">
                    {product.is_available ? "متاح" : "غير متاح"}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {products.map((product) => (
        <ProductForm
          key={product.id}
          categories={categories}
          addOns={addOns}
          product={product}
        />
      ))}
    </div>
  );
}
