"use client";

import { useEffect, useRef, useState } from "react";
import { FormAlert } from "@/components/dashboard/form-ui";
import { formatFileSizeKb } from "@/lib/images/product-image";
import {
  compressProductImage,
  uploadProductImageWithProgress,
} from "@/lib/images/compress-product-image.client";

interface ProductImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
}

type UploadPhase = "idle" | "preview" | "compressing" | "uploading" | "done";

export function ProductImageUpload({
  value,
  onChange,
  onBusyChange,
  disabled = false,
}: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRevokeRef = useRef<string | null>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewRevokeRef.current) {
        URL.revokeObjectURL(previewRevokeRef.current);
      }
    };
  }, []);

  function resetPreviewRevoke() {
    if (previewRevokeRef.current) {
      URL.revokeObjectURL(previewRevokeRef.current);
      previewRevokeRef.current = null;
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setFileName(file.name);
    resetPreviewRevoke();

    const localPreview = URL.createObjectURL(file);
    previewRevokeRef.current = localPreview;
    setPreviewUrl(localPreview);
    setOriginalSize(file.size);
    setCompressedSize(null);
    setPhase("preview");
    setProgress(5);

    try {
      setPhase("compressing");
      setProgress(15);

      const compressed = await compressProductImage(file);
      resetPreviewRevoke();
      previewRevokeRef.current = compressed.previewUrl;
      setPreviewUrl(compressed.previewUrl);
      setCompressedSize(compressed.compressedSize);
      setProgress(35);

      setPhase("uploading");
      const result = await uploadProductImageWithProgress(
        compressed.file,
        setProgress
      );

      if (result.error) {
        setError(result.error);
        setPhase("preview");
        return;
      }

      if (result.url) {
        onChange(result.url);
        setSuccess("تم رفع الصورة بنجاح");
        setPhase("done");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر معالجة الصورة");
      setPhase("preview");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove() {
    resetPreviewRevoke();
    setPreviewUrl(null);
    setFileName(null);
    setOriginalSize(null);
    setCompressedSize(null);
    setProgress(0);
    setPhase("idle");
    setError(null);
    setSuccess(null);
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const displayUrl = previewUrl ?? (value || null);
  const busy = phase === "compressing" || phase === "uploading";

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-brand-chocolate">
        صورة المنتج
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled || busy}
        onChange={handleFileChange}
        className="block w-full text-sm text-brand-muted file:me-3 file:rounded-lg file:border-0 file:bg-brand-orange-soft file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-orange hover:file:bg-brand-gold-soft disabled:opacity-60"
      />

      <p className="text-xs text-brand-muted">
        JPEG أو PNG أو WebP — يُضغط تلقائياً إلى WebP (حد أقصى 1200×1200،
        أقل من 500 ك.ب)
      </p>

      {fileName ? (
        <p className="truncate text-sm text-brand-chocolate">
          <span className="font-medium text-brand-muted">الملف: </span>
          {fileName}
        </p>
      ) : null}

      {originalSize !== null ? (
        <p className="text-xs text-brand-muted">
          الحجم الأصلي: {formatFileSizeKb(originalSize)}
          {compressedSize !== null ? (
            <>
              {" "}
              ← بعد الضغط:{" "}
              <span className="font-semibold text-brand-green">
                {formatFileSizeKb(compressedSize)}
              </span>
            </>
          ) : null}
        </p>
      ) : null}

      {busy ? (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-brand-muted">
            <span>
              {phase === "compressing" ? "جاري الضغط..." : "جاري الرفع..."}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-brand-gold/25">
            <div
              className="h-full rounded-full bg-brand-orange transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      <FormAlert message={error ?? undefined} type="error" />
      <FormAlert message={success ?? undefined} type="success" />

      {displayUrl ? (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt=""
            width={96}
            height={96}
            className="h-24 w-24 shrink-0 rounded-lg border border-brand-border object-cover"
          />
          <button
            type="button"
            disabled={disabled || busy}
            onClick={handleRemove}
            className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-muted hover:bg-brand-cream disabled:opacity-60"
          >
            إزالة الصورة
          </button>
        </div>
      ) : null}
    </div>
  );
}
