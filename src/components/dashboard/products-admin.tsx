"use client";

import { useMemo, useState, useTransition } from "react";
import {
  duplicateProduct,
  type ProductWithAddOns,
} from "@/lib/actions/products";
import { ProductForm } from "@/components/dashboard/product-form";
import { ToggleActiveButton } from "@/components/dashboard/toggle-active-button";
import {
  Badge,
  EmptyState,
  buttonSecondaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-ui";
import { formatPrice } from "@/lib/money";
import type { AddOn, Category } from "@/types/database";

type AvailabilityFilter = "all" | "available" | "unavailable";

interface ProductsAdminProps {
  categories: Category[];
  addOns: AddOn[];
  products: ProductWithAddOns[];
  toggleAction: (formData: FormData) => Promise<void>;
}

export function ProductsAdmin({
  categories,
  addOns,
  products,
  toggleAction,
}: ProductsAdminProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>("all");
  const [duplicatePendingId, setDuplicatePendingId] = useState<string | null>(
    null
  );
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name_ar])),
    [categories]
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryFilter !== "all" && product.category_id !== categoryFilter) {
        return false;
      }
      if (availabilityFilter === "available" && !product.is_available) {
        return false;
      }
      if (availabilityFilter === "unavailable" && product.is_available) {
        return false;
      }
      if (query && !product.name_ar.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [products, search, categoryFilter, availabilityFilter]);

  function handleDuplicate(productId: string) {
    setDuplicatePendingId(productId);
    setDuplicateMessage(null);
    startTransition(async () => {
      const result = await duplicateProduct(productId);
      setDuplicatePendingId(null);
      setDuplicateMessage(result.success ?? result.error ?? null);
    });
  }

  return (
    <div className="space-y-6">
      <ProductForm categories={categories} addOns={addOns} />

      {products.length > 0 ? (
        <div className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-3">
          <div>
            <label className={labelClassName()} htmlFor="product-search">
              بحث بالاسم
            </label>
            <input
              id="product-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className={inputClassName()}
            />
          </div>
          <div>
            <label className={labelClassName()} htmlFor="product-category-filter">
              القسم
            </label>
            <select
              id="product-category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={inputClassName()}
            >
              <option value="all">كل الأقسام</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name_ar}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className={labelClassName()}
              htmlFor="product-availability-filter"
            >
              الحالة
            </label>
            <select
              id="product-availability-filter"
              value={availabilityFilter}
              onChange={(e) =>
                setAvailabilityFilter(e.target.value as AvailabilityFilter)
              }
              className={inputClassName()}
            >
              <option value="all">الكل</option>
              <option value="available">متاح</option>
              <option value="unavailable">غير متاح</option>
            </select>
          </div>
        </div>
      ) : null}

      {duplicateMessage ? (
        <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">
          {duplicateMessage}
        </p>
      ) : null}

      {products.length === 0 ? (
        <EmptyState
          title="لا توجد منتجات بعد"
          description="أضف منتجاً وحدد قسمه وسعره ليظهر في قائمة الزبائن."
        />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title="لا توجد نتائج"
          description="جرّب تغيير البحث أو الفلاتر."
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
                {filteredProducts.map((product) => (
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
                      <div className="flex flex-wrap items-center gap-2">
                        <ToggleActiveButton
                          action={toggleAction}
                          entityId={product.id}
                          isActive={product.is_available}
                          activeLabel="إيقاف"
                          inactiveLabel="تفعيل"
                        />
                        <button
                          type="button"
                          onClick={() => handleDuplicate(product.id)}
                          disabled={
                            isPending && duplicatePendingId === product.id
                          }
                          className={buttonSecondaryClassName()}
                        >
                          {isPending && duplicatePendingId === product.id
                            ? "..."
                            : "نسخ"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredProducts.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-semibold text-stone-900">تعديل المنتجات</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredProducts.map((product) => (
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
