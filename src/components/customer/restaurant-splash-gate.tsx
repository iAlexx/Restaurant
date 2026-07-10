"use client";

import React from "react";
import Image from "next/image";
import { useLayoutEffect, useState } from "react";
import {
  hasSeenSplash,
  markSplashSeen,
  splashTimings,
} from "@/lib/splash/splash-session";

/** Bundled logo shown instantly when settings logo is unavailable. */
export const BUNDLED_RESTAURANT_LOGO_PATH =
  "/images/restaurant-logo-transparent.webp";

function isRemoteLogoSrc(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

interface RestaurantSplashOverlayProps {
  logoSrc: string;
  fadeOut?: boolean;
}

/** Logo-only splash overlay (exported for tests). */
export function RestaurantSplashOverlay({
  logoSrc,
  fadeOut = false,
}: RestaurantSplashOverlayProps) {
  return (
    <div
      className={`splash-overlay${fadeOut ? " splash-overlay--fade-out" : ""}`}
      role="status"
      aria-label="جاري التحميل"
    >
      <Image
        src={logoSrc}
        alt=""
        width={320}
        height={320}
        priority
        className="splash-logo"
        unoptimized={!isRemoteLogoSrc(logoSrc)}
        onError={(event) => {
          const img = event.currentTarget;
          if (img.src.includes(BUNDLED_RESTAURANT_LOGO_PATH)) return;
          img.src = BUNDLED_RESTAURANT_LOGO_PATH;
        }}
      />
    </div>
  );
}

interface RestaurantSplashGateProps {
  children: React.ReactNode;
  logoUrl?: string | null;
}

export function RestaurantSplashGate({
  children,
  logoUrl,
}: RestaurantSplashGateProps) {
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useLayoutEffect(() => {
    if (hasSeenSplash()) return;

    markSplashSeen();
    setOverlayVisible(true);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const { holdMs, fadeOutMs } = splashTimings(reducedMotion);

    const fadeTimer = window.setTimeout(() => setFadeOut(true), holdMs);
    const hideTimer = window.setTimeout(
      () => setOverlayVisible(false),
      holdMs + fadeOutMs
    );

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  const logoSrc = logoUrl?.trim() || BUNDLED_RESTAURANT_LOGO_PATH;

  return (
    <>
      {children}
      {overlayVisible ? (
        <RestaurantSplashOverlay logoSrc={logoSrc} fadeOut={fadeOut} />
      ) : null}
    </>
  );
}
