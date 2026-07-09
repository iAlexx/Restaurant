type ProductImageVariant = "thumb" | "hero" | "card" | "card-thumb";

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
  "card-thumb": {
    width: 120,
    height: 90,
    className:
      "h-full w-full rounded-xl object-cover aspect-[4/3]",
    sizes: "(max-width: 640px) 120px, 120px",
  },
  card: {
    width: 400,
    height: 300,
    className: "h-full w-full object-cover aspect-[4/3]",
    sizes: "(max-width: 640px) 120px, (max-width: 1024px) 50vw, 33vw",
  },
  hero: {
    width: 512,
    height: 384,
    className: "h-full w-full object-cover aspect-[4/3]",
    sizes: "(max-width: 640px) 100vw, 512px",
  },
};

export function ProductImage({
  src,
  variant = "thumb",
  priority = false,
  className = "",
}: {
  src: string;
  variant?: ProductImageVariant;
  /** Disable lazy loading for above-the-fold modal hero if needed. */
  priority?: boolean;
  className?: string;
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
      className={`${cfg.className} ${className}`.trim()}
    />
  );
}
