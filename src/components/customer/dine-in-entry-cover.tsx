"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import type { PublicRestaurantSettings } from "@/lib/menu/public-menu";
import {
  isRemoteHeroImage,
  resolveDineInHeroSrc,
  resolveDineInWelcomeMessage,
} from "@/lib/dine-in/hero-image";
import { buttonPrimaryClassName } from "@/components/dashboard/form-ui";

interface DineInEntryCoverProps {
  settings: PublicRestaurantSettings;
  ctaLabel: string;
  onCta: () => void;
  tableLabel?: string;
  secondaryAction?: ReactNode;
  showBackToCoverHint?: boolean;
}

export function DineInEntryCover({
  settings,
  ctaLabel,
  onCta,
  tableLabel,
  secondaryAction,
  showBackToCoverHint = false,
}: DineInEntryCoverProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const heroSrc = resolveDineInHeroSrc(settings);
  const welcomeLines = resolveDineInWelcomeMessage(settings).split("\n");
  const showHeroImage = !imageFailed;

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-brand-cream">
      <div className="relative min-h-[52vh] shrink-0 overflow-hidden sm:min-h-[58vh]">
        <div
          className="absolute inset-0 bg-gradient-to-br from-brand-orange/25 via-brand-cream to-brand-gold/30"
          aria-hidden="true"
        />

        {showHeroImage ? (
          <Image
            src={heroSrc}
            alt=""
            fill
            priority
            sizes="(max-width: 640px) 100vw, 1200px"
            className="object-cover object-center motion-scale-in motion-reduce:animate-none"
            onError={() => setImageFailed(true)}
            unoptimized={!isRemoteHeroImage(heroSrc)}
          />
        ) : null}

        <div
          className="absolute inset-0 bg-gradient-to-t from-brand-chocolate/85 via-brand-chocolate/45 to-brand-chocolate/20"
          aria-hidden="true"
        />

        <div className="relative z-10 flex min-h-[52vh] flex-col items-center justify-end px-4 pb-8 pt-10 text-center sm:min-h-[58vh] sm:px-6 sm:pb-10">
          <div className="motion-fade-up motion-reduce:animate-none">
            {settings.logo_url ? (
              <div className="relative mx-auto mb-4 h-[72px] w-[72px] overflow-hidden rounded-full ring-4 ring-brand-gold/60 sm:h-[88px] sm:w-[88px]">
                <Image
                  src={settings.logo_url}
                  alt=""
                  fill
                  sizes="88px"
                  className="object-cover"
                  unoptimized={!isRemoteHeroImage(settings.logo_url)}
                />
              </div>
            ) : (
              <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-brand-orange-soft text-3xl ring-4 ring-brand-gold/60 sm:h-[88px] sm:w-[88px] sm:text-4xl">
                🍽
              </div>
            )}

            <h1 className="text-[22px] font-extrabold leading-tight text-white sm:text-[28px]">
              {settings.name}
            </h1>

            <div className="mt-2 space-y-1">
              {welcomeLines.map((line) => (
                <p
                  key={line}
                  className="text-sm leading-relaxed text-white/90 sm:text-base"
                >
                  {line}
                </p>
              ))}
            </div>

            {tableLabel ? (
              <p className="mx-auto mt-4 inline-flex max-w-full items-center justify-center rounded-full border border-brand-gold/50 bg-brand-gold/20 px-4 py-2 text-sm font-bold text-brand-cream backdrop-blur-sm sm:text-base">
                أنت تطلب للطاولة رقم {tableLabel}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="motion-fade-up flex flex-1 flex-col items-center justify-start gap-3 px-4 py-6 sm:px-6 motion-reduce:animate-none">
        <button
          type="button"
          onClick={onCta}
          className={`${buttonPrimaryClassName()} w-full max-w-md min-h-[48px] text-base`}
        >
          {ctaLabel}
        </button>

        {secondaryAction ? (
          <div className="flex justify-center">{secondaryAction}</div>
        ) : null}

        {showBackToCoverHint ? (
          <p className="text-xs text-brand-muted">اضغط على الشعار للعودة للواجهة</p>
        ) : null}
      </div>
    </div>
  );
}
