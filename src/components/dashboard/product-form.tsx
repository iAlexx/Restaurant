"use client";

import { useActionState, useState } from "react";
import {
  createProduct,
  updateProduct,
  type ProductWithAddOns,
} from "@/lib/actions/products";
import type { ActionResult } from "@/lib/actions/types";
import { uploadMenuImage } from "@/lib/actions/upload";
import {
  FormAlert,
  buttonPrimaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-ui";
import type { AddOn, Category } from "@/types/database";

const initial: ActionResult = {};

interface ProductFormProps {
  categories: Category[];
  addOns: AddOn[];
  product?: ProductWithAddOns;
}

export function ProductForm({ categories, addOns, product }: ProductFormProps) {
  const action = product
    ? updateProduct.bind(null, product.id)
    : createProduct;
  const [state, formAction, pending] = useActionState(action, initial);
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadMenuImage(formData, "products");
    setUploading(false);

    if (result.error) {
      setUploadError(result.error);
      return;
    }
    if (result.url) setImageUrl(result.url);
  }

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-stone-200 p-4">
      <h2 className="font-semibold text-stone-900">
        {product ? "تعديل المنتج" : "منتج جديد"}
      </h2>
      <FormAlert message={state.error} type="error" />
      <FormAlert message={state.success} type="success" />
      <FormAlert message={uploadError ?? undefined} type="error" />

      <input type="hidden" name="image_url" value={imageUrl} />

      <div>
        <label className={labelClassName()} htmlFor={`category-${product?.id ?? "new"}`}>
          القسم
        </label>
        <select
          id={`category-${product?.id ?? "new"}`}
          name="category_id"
          required
          defaultValue={product?.category_id ?? ""}
          className={inputClassName()}
        >
          <option value="">اختر قسماً</option>
          {categories
            .filter((c) => c.is_active)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_ar}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className={labelClassName()} htmlFor={`name-${product?.id ?? "new"}`}>
          اسم المنتج
        </label>
        <input
          id={`name-${product?.id ?? "new"}`}
          name="name_ar"
          required
          defaultValue={product?.name_ar ?? ""}
          className={inputClassName()}
        />
      </div>

      <div>
        <label className={labelClassName()} htmlFor={`desc-${product?.id ?? "new"}`}>
          الوصف
        </label>
        <textarea
          id={`desc-${product?.id ?? "new"}`}
          name="description_ar"
          rows={2}
          defaultValue={product?.description_ar ?? ""}
          className={inputClassName()}
        />
      </div>

      <div>
        <label className={labelClassName()} htmlFor={`price-${product?.id ?? "new"}`}>
          السعر (ل.س — عدد صحيح)
        </label>
        <input
          id={`price-${product?.id ?? "new"}`}
          name="price"
          type="number"
          min={0}
          step={1}
          required
          defaultValue={product?.price ?? 0}
          className={inputClassName()}
        />
      </div>

      <div>
        <label className={labelClassName()} htmlFor={`sort-${product?.id ?? "new"}`}>
          ترتيب العرض
        </label>
        <input
          id={`sort-${product?.id ?? "new"}`}
          name="sort_order"
          type="number"
          min={0}
          defaultValue={product?.sort_order ?? 0}
          className={inputClassName()}
        />
      </div>

      <div>
        <label className={labelClassName()}>صورة المنتج</label>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
        {uploading ? <p className="text-xs text-stone-500">جاري الرفع...</p> : null}
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="mt-2 h-24 w-24 rounded-lg object-cover" />
        ) : null}
      </div>

      {addOns.length > 0 ? (
        <fieldset>
          <legend className={labelClassName()}>الإضافات المتاحة</legend>
          <div className="mt-2 space-y-2">
            {addOns.map((addOn) => (
              <label key={addOn.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="add_on_ids"
                  value={addOn.id}
                  defaultChecked={product?.add_on_ids.includes(addOn.id)}
                />
                {addOn.name_ar}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          name="is_available"
          defaultChecked={product?.is_available ?? true}
        />
        متاح للطلب
      </label>

      <button type="submit" disabled={pending || uploading} className={buttonPrimaryClassName()}>
        {pending ? "جاري الحفظ..." : product ? "تحديث" : "إضافة"}
      </button>
    </form>
  );
}
