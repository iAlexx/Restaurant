import { requireAdminPage } from "@/lib/auth/admin-page";
import { listCategories } from "@/lib/actions/categories";
import { listAddOns } from "@/lib/actions/add-ons";
import { listProducts, toggleProductAvailableForm } from "@/lib/actions/products";
import { ProductsAdmin } from "@/components/dashboard/products-admin";
import { PageHeader } from "@/components/dashboard/form-ui";

export default async function ProductsPage() {
  await requireAdminPage();
  const [categories, addOns, products] = await Promise.all([
    listCategories(),
    listAddOns(),
    listProducts(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="المنتجات"
        description="إدارة منتجات القائمة والأسعار"
      />

      <ProductsAdmin
        categories={categories}
        addOns={addOns}
        products={products}
        toggleAction={toggleProductAvailableForm}
      />
    </div>
  );
}
