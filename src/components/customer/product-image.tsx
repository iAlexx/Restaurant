type ProductImageVariant = "thumb" | "hero";

const VARIANTS: Record<
  ProductImageVariant,
  { width: number; height: number; className: string; sizes: string }
> = {
  thumb: {
    width: 96,
    height: 96,
    className: "h-24 w-24 shrink-0 rounded-xl object-cover",
    sizes: "(max-width: 640px) 96px, 96px",
  },
  hero: {
    width: 512,
    height: 288,
    className: "h-52 w-full rounded-xl object-cover",
    sizes: "(max-width: 640px) 100vw, 512px",
  },
};

export function ProductImage({
  src,
  variant = "thumb",
  priority = false,
}: {
  src: string;
  variant?: ProductImageVariant;
  /** Disable lazy loading for above-the-fold modal hero if needed. */
  priority?: boolean;
}) {
  const cfg = VARIANTS[variant];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={cfg.width}
      height={cfg.height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      sizes={cfg.sizes}
      className={cfg.className}
    />
  );
}
