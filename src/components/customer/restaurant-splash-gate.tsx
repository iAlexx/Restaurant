"use client";

import { useLayoutEffect, useState } from "react";
import {
  hasSeenSplash,
  markSplashSeen,
  splashTimings,
} from "@/lib/splash/splash-session";

/** Bundled logo shown instantly when settings logo is unavailable. */
export const BUNDLED_RESTAURANT_LOGO_PATH = "/images/restaurant-logo.webp";

interface RestaurantSplashGateProps {
  children: React.ReactNode;
  logoUrl?: string | null;
  restaurantName?: string;
}

export function RestaurantSplashGate({
  children,
  logoUrl,
  restaurantName,
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
        <div
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-brand-cream px-6 text-center motion-reduce:transition-none ${
            fadeOut ? "splash-overlay-fade-out" : ""
          }`}
          role="status"
          aria-live="polite"
          aria-label={restaurantName ? `جاري فتح ${restaurantName}` : "جاري التحميل"}
        >
          <div className="pointer-events-none flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt=""
              width={128}
              height={128}
              className="splash-logo-in h-24 w-24 rounded-full object-cover ring-2 ring-brand-gold/50 sm:h-28 sm:w-28 md:h-[140px] md:w-[140px] motion-reduce:animate-none"
              onError={(event) => {
                const img = event.currentTarget;
                if (img.src.includes(BUNDLED_RESTAURANT_LOGO_PATH)) {
                  img.style.display = "none";
                  return;
                }
                img.src = BUNDLED_RESTAURANT_LOGO_PATH;
              }}
            />
            {restaurantName ? (
              <p className="splash-logo-in mt-4 max-w-xs text-lg font-extrabold text-brand-chocolate sm:text-xl motion-reduce:animate-none">
                {restaurantName}
              </p>
            ) : null}
            <div
              className="mt-6 h-1 w-12 rounded-full bg-brand-orange/80"
              aria-hidden="true"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
