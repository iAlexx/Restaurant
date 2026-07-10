type CategoryImageProps = {
  src: string | null;
  alt: string;
  className?: string;
};

export function CategoryImage({ src, alt, className = "" }: CategoryImageProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={320}
        height={240}
        loading="lazy"
        decoding="async"
        className={className}
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-gold-soft/80 to-brand-orange-soft/60 ${className}`}
      aria-hidden="true"
    >
      <span className="text-3xl opacity-70 sm:text-4xl">🍽</span>
    </div>
  );
}
