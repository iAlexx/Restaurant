"use client";

import Image from "next/image";
import { BUNDLED_RESTAURANT_LOGO_PATH } from "@/components/customer/restaurant-splash-gate";

function isRemoteLogoSrc(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

type RestaurantLogoVariant = "landing" | "header";

const VARIANTS: Record<
  RestaurantLogoVariant,
  { width: number; height: number; className: string }
> = {
  landing: {
    width: 280,
    height: 195,
    className:
      "motion-scale-in mx-auto mb-5 h-auto w-[min(100%,clamp(180px,50vw,280px))] max-h-[195px] object-contain",
  },
  header: {
    width: 48,
    height: 40,
    className:
      "h-9 w-auto max-h-9 max-w-[48px] shrink-0 object-contain sm:h-10 sm:max-h-10 sm:max-w-[52px]",
  },
};

export function RestaurantLogo({
  logoUrl,
  variant = "landing",
  priority = variant === "landing",
}: {
  logoUrl?: string | null;
  variant?: RestaurantLogoVariant;
  priority?: boolean;
}) {
  const logoSrc = logoUrl?.trim() || BUNDLED_RESTAURANT_LOGO_PATH;
  const config = VARIANTS[variant];

  return (
    <Image
      src={logoSrc}
      alt=""
      width={config.width}
      height={config.height}
      priority={priority}
      className={config.className}
      unoptimized={!isRemoteLogoSrc(logoSrc)}
      onError={(event) => {
        const img = event.currentTarget;
        if (img.src.includes(BUNDLED_RESTAURANT_LOGO_PATH)) return;
        img.src = BUNDLED_RESTAURANT_LOGO_PATH;
      }}
    />
  );
}
