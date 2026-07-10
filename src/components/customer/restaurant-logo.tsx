"use client";

import Image from "next/image";
import { BUNDLED_RESTAURANT_LOGO_PATH } from "@/components/customer/restaurant-splash-gate";

function isRemoteLogoSrc(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

export function RestaurantLogo({ logoUrl }: { logoUrl?: string | null }) {
  const logoSrc = logoUrl?.trim() || BUNDLED_RESTAURANT_LOGO_PATH;

  return (
    <Image
      src={logoSrc}
      alt=""
      width={230}
      height={150}
      priority
      className="motion-scale-in mx-auto mb-5 h-auto w-[min(100%,clamp(150px,42vw,220px))] max-h-[150px] object-contain"
      unoptimized={!isRemoteLogoSrc(logoSrc)}
      onError={(event) => {
        const img = event.currentTarget;
        if (img.src.includes(BUNDLED_RESTAURANT_LOGO_PATH)) return;
        img.src = BUNDLED_RESTAURANT_LOGO_PATH;
      }}
    />
  );
}
