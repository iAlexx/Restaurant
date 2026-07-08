import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import {
  PRODUCT_IMAGE_HARD_LIMIT_BYTES,
  isAllowedProductImageType,
} from "@/lib/images/product-image";

const ALLOWED_FOLDERS = new Set(["products", "logo"]);

export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const folderRaw = formData.get("folder");
  const folder =
    typeof folderRaw === "string" && ALLOWED_FOLDERS.has(folderRaw)
      ? folderRaw
      : "products";

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "لم يتم اختيار ملف" }, { status: 400 });
  }

  if (file.size > PRODUCT_IMAGE_HARD_LIMIT_BYTES) {
    return NextResponse.json(
      { error: "حجم الصورة يجب ألا يتجاوز 500 كيلوبايت بعد الضغط" },
      { status: 400 }
    );
  }

  if (!isAllowedProductImageType(file.type)) {
    return NextResponse.json(
      { error: "نوع الملف غير مدعوم. استخدم JPEG أو PNG أو WebP" },
      { status: 400 }
    );
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
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
    return NextResponse.json({ error: "تعذر رفع الصورة" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("menu").getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrl });
}
