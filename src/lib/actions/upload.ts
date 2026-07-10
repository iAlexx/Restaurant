"use server";

import { requireAdminSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";

import {
  PRODUCT_IMAGE_HARD_LIMIT_BYTES,
  isAllowedProductImageType,
} from "@/lib/images/product-image";

export async function uploadMenuImage(
  formData: FormData,
  folder: "products" | "logo" | "hero"
): Promise<{ url?: string; error?: string }> {
  await requireAdminSession();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "لم يتم اختيار ملف" };
  }

  if (file.size > PRODUCT_IMAGE_HARD_LIMIT_BYTES) {
    return { error: "حجم الصورة يجب ألا يتجاوز 500 كيلوبايت" };
  }

  if (!isAllowedProductImageType(file.type)) {
    return { error: "نوع الملف غير مدعوم. استخدم JPEG أو PNG أو WebP" };
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const fileName = `${folder}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createServiceClient();
  const { error: uploadError } = await supabase.storage
    .from("menu")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: "تعذر رفع الصورة" };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("menu").getPublicUrl(fileName);

  return { url: publicUrl };
}
