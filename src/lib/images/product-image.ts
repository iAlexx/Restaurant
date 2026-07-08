/** Product image optimization constants (shared client + tests). */

export const PRODUCT_IMAGE_MAX_DIMENSION = 1200;
export const PRODUCT_IMAGE_TARGET_BYTES = 300 * 1024;
export const PRODUCT_IMAGE_HARD_LIMIT_BYTES = 500 * 1024;
export const PRODUCT_IMAGE_MAX_SOURCE_BYTES = 15 * 1024 * 1024;
export const PRODUCT_IMAGE_QUALITY_START = 0.82;
export const PRODUCT_IMAGE_QUALITY_MIN = 0.75;
export const PRODUCT_IMAGE_QUALITY_STEP = 0.02;

export const PRODUCT_IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ProductImageAllowedType = (typeof PRODUCT_IMAGE_ALLOWED_TYPES)[number];

export function isAllowedProductImageType(
  type: string
): type is ProductImageAllowedType {
  return (PRODUCT_IMAGE_ALLOWED_TYPES as readonly string[]).includes(type);
}

export interface FitDimensions {
  width: number;
  height: number;
}

/** Scale down to fit inside maxW×maxH while preserving aspect ratio. */
export function computeFitDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxW = PRODUCT_IMAGE_MAX_DIMENSION,
  maxH = PRODUCT_IMAGE_MAX_DIMENSION
): FitDimensions {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return { width: 1, height: 1 };
  }
  const ratio = Math.min(maxW / sourceWidth, maxH / sourceHeight, 1);
  return {
    width: Math.max(1, Math.round(sourceWidth * ratio)),
    height: Math.max(1, Math.round(sourceHeight * ratio)),
  };
}

export function formatFileSizeKb(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} ك.ب`;
  return `${(kb / 1024).toFixed(1)} م.ب`;
}

export function generateProductImageFilename(): string {
  return `${crypto.randomUUID()}.webp`;
}

export function validateProductSourceFile(file: File): string | null {
  if (!isAllowedProductImageType(file.type)) {
    return "نوع الملف غير مدعوم. استخدم JPEG أو PNG أو WebP فقط.";
  }
  if (file.size > PRODUCT_IMAGE_MAX_SOURCE_BYTES) {
    return "حجم الصورة الأصلية كبير جداً (الحد الأقصى 15 م.ب). اختر صورة أصغر.";
  }
  if (file.size === 0) {
    return "الملف فارغ.";
  }
  return null;
}

export function pickCompressionQuality(attempt: number): number {
  const q =
    PRODUCT_IMAGE_QUALITY_START - attempt * PRODUCT_IMAGE_QUALITY_STEP;
  return Math.max(PRODUCT_IMAGE_QUALITY_MIN, q);
}
