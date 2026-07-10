"use client";

import { useActionState, useState } from "react";
import {
  createCategory,
  updateCategory,
} from "@/lib/actions/categories";
import { uploadMenuImage } from "@/lib/actions/upload";
import type { ActionResult } from "@/lib/actions/types";
import {
  FormAlert,
  buttonPrimaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-ui";
import type { Category } from "@/types/database";

const initial: ActionResult = {};

export function CategoryForm({ category }: { category?: Category }) {
  const action = category
    ? updateCategory.bind(null, category.id)
    : createCategory;
  const [state, formAction, pending] = useActionState(action, initial);
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadMenuImage(formData, "categories");
    setUploading(false);

    if (result.error) {
      setUploadError(result.error);
      return;
    }
    if (result.url) setImageUrl(result.url);
  }

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-brand-border bg-brand-surface p-4 shadow-sm">
      <h2 className="font-semibold text-brand-chocolate">
        {category ? "تعديل القسم" : "قسم جديد"}
      </h2>
      <FormAlert message={state.error} type="error" />
      <FormAlert message={state.success} type="success" />
      <FormAlert message={uploadError ?? undefined} type="error" />

      <input type="hidden" name="image_url" value={imageUrl} />

      <div>
        <label className={labelClassName()} htmlFor="name_ar">اسم القسم</label>
        <input
          id="name_ar"
          name="name_ar"
          required
          defaultValue={category?.name_ar ?? ""}
          className={inputClassName()}
        />
      </div>

      <div>
        <label className={labelClassName()} htmlFor="category_image">
          صورة القسم
        </label>
        <input
          id="category_image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={pending || uploading}
          onChange={handleImageChange}
          className="block w-full text-sm text-brand-muted file:me-3 file:rounded-lg file:border-0 file:bg-brand-orange-soft file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-orange hover:file:bg-brand-gold-soft disabled:opacity-60"
        />
        <p className="mt-1 text-xs text-brand-muted">
          JPEG أو PNG أو WebP — تظهر في بطاقة القسم للعميل
        </p>
        {imageUrl ? (
          <div className="mt-3 flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              width={120}
              height={90}
              className="h-[90px] w-[120px] shrink-0 rounded-lg border border-brand-border object-cover"
            />
            <button
              type="button"
              disabled={pending || uploading}
              onClick={() => setImageUrl("")}
              className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-muted hover:bg-brand-cream disabled:opacity-60"
            >
              إزالة الصورة
            </button>
          </div>
        ) : null}
      </div>

      <div>
        <label className={labelClassName()} htmlFor="sort_order">ترتيب العرض</label>
        <input
          id="sort_order"
          name="sort_order"
          type="number"
          min={0}
          defaultValue={category?.sort_order ?? 0}
          className={inputClassName()}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-brand-chocolate">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={category?.is_active ?? true}
        />
        نشط
      </label>

      <button
        type="submit"
        disabled={pending || uploading}
        className={buttonPrimaryClassName()}
      >
        {pending ? "جاري الحفظ..." : category ? "تحديث" : "إضافة"}
      </button>
    </form>
  );
}
