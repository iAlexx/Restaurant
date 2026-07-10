"use client";

import { useEffect, useState } from "react";
import type { PublicRestaurantSettings } from "@/lib/menu/public-menu";
import {
  hasSeenLandingCover,
  markLandingCoverSeen,
} from "@/lib/dine-in/entry-cover-session";
import { DineInEntryCover } from "@/components/customer/dine-in-entry-cover";

export function DineInLandingGate({
  settings,
  children,
}: {
  settings: PublicRestaurantSettings;
  children: React.ReactNode;
}) {
  const [coverOpen, setCoverOpen] = useState<boolean | null>(null);

  useEffect(() => {
    setCoverOpen(!hasSeenLandingCover());
  }, []);

  if (coverOpen === null) {
    return (
      <div className="min-h-[100dvh] bg-brand-cream" aria-busy="true" aria-label="جاري التحميل" />
    );
  }

  if (coverOpen) {
    return (
      <DineInEntryCover
        settings={settings}
        ctaLabel="اختيار الطاولة"
        onCta={() => {
          markLandingCoverSeen();
          setCoverOpen(false);
        }}
      />
    );
  }

  return <>{children}</>;
}
