"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicRestaurantSettings } from "@/lib/menu/public-menu";
import type { DineInContext } from "@/lib/dine-in/paths";
import {
  clearTableEntryCoverSeen,
  hasSeenTableEntryCover,
  markTableEntryCoverSeen,
} from "@/lib/dine-in/entry-cover-session";
import { DineInEntryCover } from "@/components/customer/dine-in-entry-cover";
import { ChangeTableLink } from "@/components/customer/change-table-link";

interface DineInMenuEntryGateProps {
  settings: PublicRestaurantSettings;
  ctx: DineInContext;
  children: React.ReactNode;
  onCoverOpenChange?: (open: boolean) => void;
}

export function DineInMenuEntryGate({
  settings,
  ctx,
  children,
  onCoverOpenChange,
}: DineInMenuEntryGateProps) {
  const [coverOpen, setCoverOpen] = useState<boolean | null>(null);

  useEffect(() => {
    setCoverOpen(!hasSeenTableEntryCover(ctx.tableToken));
  }, [ctx.tableToken]);

  useEffect(() => {
    if (coverOpen === null) return;
    onCoverOpenChange?.(coverOpen);
  }, [coverOpen, onCoverOpenChange]);

  const dismissCover = useCallback(() => {
    markTableEntryCoverSeen(ctx.tableToken);
    setCoverOpen(false);
  }, [ctx.tableToken]);

  const reopenCover = useCallback(() => {
    clearTableEntryCoverSeen(ctx.tableToken);
    setCoverOpen(true);
  }, [ctx.tableToken]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ tableToken: string }>).detail;
      if (detail?.tableToken === ctx.tableToken) {
        reopenCover();
      }
    };

    window.addEventListener("dine-in-reopen-cover", handler);
    return () => window.removeEventListener("dine-in-reopen-cover", handler);
  }, [ctx.tableToken, reopenCover]);

  if (coverOpen === null) {
    return (
      <div className="min-h-[100dvh] bg-brand-cream" aria-busy="true" aria-label="جاري التحميل" />
    );
  }

  if (coverOpen) {
    return (
      <DineInEntryCover
        settings={settings}
        tableLabel={ctx.tableLabel}
        ctaLabel="عرض القائمة"
        onCta={dismissCover}
        secondaryAction={
          ctx.flow === "unified" ? (
            <ChangeTableLink className="text-sm font-medium text-brand-muted underline-offset-2 hover:text-brand-chocolate hover:underline" />
          ) : undefined
        }
      />
    );
  }

  return <>{children}</>;
}

export function dispatchReopenDineInCover(tableToken: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("dine-in-reopen-cover", { detail: { tableToken } })
  );
}
