import {
  computeFitDimensions,
  generateProductImageFilename,
  PRODUCT_IMAGE_HARD_LIMIT_BYTES,
  PRODUCT_IMAGE_TARGET_BYTES,
  pickCompressionQuality,
  validateProductSourceFile,
} from "@/lib/images/product-image";

export interface CompressProductImageResult {
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

function canvasSupportsWebP(): boolean {
  if (typeof document === "undefined") return true;
  const canvas = document.createElement("canvas");
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("تعذر ضغط الصورة"));
      },
      mime,
      quality
    );
  });
}

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  const useWebP = canvasSupportsWebP();
  const mime = useWebP ? "image/webp" : "image/jpeg";
  return canvasToBlob(canvas, mime, quality);
}

async function renderToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("المتصفح لا يدعم معالجة الصور");
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

async function compressAtSize(
  source: CanvasImageSource,
  width: number,
  height: number
): Promise<{ blob: Blob; mime: string }> {
  let canvas = await renderToCanvas(source, width, height);
  let attempt = 0;
  let blob = await encodeCanvas(canvas, pickCompressionQuality(attempt));
  let mime = blob.type;

  while (
    blob.size > PRODUCT_IMAGE_TARGET_BYTES &&
    pickCompressionQuality(attempt + 1) <
      pickCompressionQuality(attempt) - 0.001
  ) {
    attempt += 1;
    blob = await encodeCanvas(canvas, pickCompressionQuality(attempt));
    mime = blob.type;
  }

  if (blob.size > PRODUCT_IMAGE_HARD_LIMIT_BYTES) {
    const smaller = computeFitDimensions(
      width,
      height,
      Math.round(width * 0.85),
      Math.round(height * 0.85)
    );
    canvas = await renderToCanvas(source, smaller.width, smaller.height);
    attempt = 0;
    blob = await encodeCanvas(canvas, pickCompressionQuality(attempt));
    mime = blob.type;

    while (
      blob.size > PRODUCT_IMAGE_HARD_LIMIT_BYTES &&
      pickCompressionQuality(attempt + 1) <
        pickCompressionQuality(attempt) - 0.001
    ) {
      attempt += 1;
      blob = await encodeCanvas(canvas, pickCompressionQuality(attempt));
      mime = blob.type;
    }
  }

  return { blob, mime };
}

/**
 * Compress a product image in the browser before upload.
 * Output: WebP (or JPEG fallback), max 1200×1200, ≤500 KB hard limit.
 */
export async function compressProductImage(
  file: File
): Promise<CompressProductImageResult> {
  const validationError = validateProductSourceFile(file);
  if (validationError) throw new Error(validationError);

  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = computeFitDimensions(bitmap.width, bitmap.height);
    const { blob, mime } = await compressAtSize(bitmap, width, height);

    if (blob.size > PRODUCT_IMAGE_HARD_LIMIT_BYTES) {
      throw new Error(
        "تعذر ضغط الصورة تحت 500 ك.ب. جرّب صورة أبسط أو بدقة أقل."
      );
    }

    const ext = mime === "image/webp" ? "webp" : "jpg";
    const filename = generateProductImageFilename().replace(/\.webp$/, `.${ext}`);
    const optimized = new File([blob], filename, { type: mime });
    const previewUrl = URL.createObjectURL(blob);

    return {
      file: optimized,
      previewUrl,
      originalSize: file.size,
      compressedSize: blob.size,
      width,
      height,
    };
  } finally {
    bitmap.close();
  }
}

export async function uploadProductImageWithProgress(
  file: File,
  onProgress: (percent: number) => void
): Promise<{ url?: string; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "products");

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      const pct = Math.min(
        100,
        Math.round(40 + (event.loaded / event.total) * 60)
      );
      onProgress(pct);
    });

    xhr.addEventListener("load", () => {
      try {
        const data = JSON.parse(xhr.responseText) as {
          url?: string;
          error?: string;
        };
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve(data);
        } else {
          resolve({ error: data.error ?? "تعذر رفع الصورة" });
        }
      } catch {
        resolve({ error: "تعذر رفع الصورة" });
      }
    });

    xhr.addEventListener("error", () => {
      resolve({ error: "تعذر الاتصال أثناء رفع الصورة" });
    });

    xhr.open("POST", "/api/admin/upload/menu");
    xhr.send(formData);
  });
}
