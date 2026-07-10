"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicRestaurantSettings } from "@/lib/menu/public-menu";
import { unifiedDineInHref } from "@/lib/dine-in/paths";
import {
  readCachedDineInTable,
  writeCachedDineInTable,
} from "@/lib/dine-in/session-table";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { CustomerHeader } from "@/components/customer/customer-header";
import { CustomerPageShell } from "@/components/customer/customer-menu-shell";
import { RestaurantOpenStatus } from "@/components/customer/restaurant-open-status";
import type { RestaurantOpenStatus as OpenStatus } from "@/lib/hours/types";
import type { CartState } from "@/types/cart";

interface PublicTableOption {
  label: string;
  public_token: string;
}

function otherTableCartHasItems(publicToken: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(`restaurant-cart-dine-${publicToken}`);
    if (!raw) return false;
    const cart = JSON.parse(raw) as CartState;
    return cart.lines.length > 0;
  } catch {
    return false;
  }
}

function clearTableCart(publicToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`restaurant-cart-dine-${publicToken}`);
  sessionStorage.removeItem(`restaurant-cart-dine-${publicToken}-submit`);
}

export function TableSelectionScreen({
  settings,
  openStatus,
  tables,
}: {
  settings: PublicRestaurantSettings;
  openStatus: OpenStatus;
  tables: PublicTableOption[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<{
    publicToken: string;
    label: string;
  } | null>(null);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [hoveredToken, setHoveredToken] = useState<string | null>(null);
  const [cachedToken, setCachedToken] = useState<string | null>(null);

  useEffect(() => {
    setCachedToken(readCachedDineInTable()?.publicToken ?? null);
  }, []);

  function navigateToTable(publicToken: string, label: string) {
    writeCachedDineInTable({ publicToken, label });
    router.push(unifiedDineInHref("menu", publicToken));
  }

  function handleSelect(publicToken: string, label: string) {
    setSelectedToken(publicToken);
    const cached = readCachedDineInTable();
    if (
      cached &&
      cached.publicToken !== publicToken &&
      otherTableCartHasItems(cached.publicToken)
    ) {
      setPending({ publicToken, label });
      return;
    }
    if (cached && cached.publicToken !== publicToken) {
      clearTableCart(cached.publicToken);
    }
    navigateToTable(publicToken, label);
  }

  function confirmSwitch() {
    if (!pending) return;
    const cached = readCachedDineInTable();
    if (cached) clearTableCart(cached.publicToken);
    navigateToTable(pending.publicToken, pending.label);
    setPending(null);
  }

  return (
    <CustomerPageShell
      header={
        <CustomerHeader settings={settings} showCart={false} itemCount={0} />
      }
      pageTitle="اختر طاولتك"
      pageSubtitle="حدّد رقم طاولتك للمتابعة إلى القائمة"
    >
      <RestaurantOpenStatus status={openStatus} variant="banner" className="mb-5" />
      {tables.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-gold/50 bg-brand-surface px-6 py-16 text-center shadow-sm">
          <p className="text-lg font-extrabold text-brand-chocolate">
            لا توجد طاولات متاحة حالياً
          </p>
          <p className="mt-2 text-sm leading-relaxed text-brand-muted">
            يرجى التواصل مع موظف المطعم.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {tables.map((table, index) => {
            const isCached = cachedToken === table.public_token;
            const isSelected = selectedToken === table.public_token;
            const isHovered = hoveredToken === table.public_token;

            return (
              <button
                key={table.public_token}
                type="button"
                onClick={() => handleSelect(table.public_token, table.label)}
                onMouseEnter={() => setHoveredToken(table.public_token)}
                onMouseLeave={() => setHoveredToken(null)}
                className={`motion-fade-up flex min-h-[100px] flex-col items-center justify-center rounded-2xl border bg-brand-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] motion-reduce:transform-none ${
                  isCached
                    ? "border-brand-orange ring-2 ring-brand-orange/25"
                    : isSelected || isHovered
                      ? "border-brand-gold shadow-md"
                      : "border-brand-gold/40"
                } ${index < 4 ? `motion-stagger-${index + 1}` : ""}`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                    isCached
                      ? "bg-brand-orange-soft"
                      : "bg-brand-gold-soft"
                  }`}
                >
                  🍽
                </span>
                <span className="mt-2 text-lg font-extrabold text-brand-chocolate">
                  {table.label}
                </span>
                {isCached ? (
                  <span className="mt-1 text-xs font-semibold text-brand-orange">
                    آخر اختيار
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={pending !== null}
        title="تغيير الطاولة؟"
        description="السلة تحتوي على أصناف لطاولة أخرى. سيتم إفراغها ولن تُنقل. هل تريد المتابعة؟"
        confirmLabel="تغيير الطاولة"
        tone="danger"
        onCancel={() => setPending(null)}
        onConfirm={confirmSwitch}
      />
    </CustomerPageShell>
  );
}
