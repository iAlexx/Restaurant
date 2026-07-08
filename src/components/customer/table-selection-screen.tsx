"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicRestaurantSettings } from "@/lib/menu/public-menu";
import { unifiedDineInHref } from "@/lib/dine-in/paths";
import {
  readCachedDineInTable,
  writeCachedDineInTable,
} from "@/lib/dine-in/session-table";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
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
  tables,
}: {
  settings: PublicRestaurantSettings;
  tables: PublicTableOption[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<{
    publicToken: string;
    label: string;
  } | null>(null);

  function navigateToTable(publicToken: string, label: string) {
    writeCachedDineInTable({ publicToken, label });
    router.push(unifiedDineInHref("menu", publicToken));
  }

  function handleSelect(publicToken: string, label: string) {
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
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-4 py-8 text-center">
        {settings.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.logo_url}
            alt=""
            className="mx-auto mb-3 h-16 w-16 rounded-full object-cover ring-1 ring-stone-200"
          />
        ) : (
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
            🍽
          </div>
        )}
        <h1 className="text-2xl font-extrabold text-stone-900">
          {settings.name}
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          اختر رقم طاولتك للمتابعة إلى القائمة
        </p>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8">
        {tables.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
            <p className="font-semibold text-stone-800">
              لا توجد طاولات متاحة حالياً
            </p>
            <p className="mt-2 text-sm text-stone-500">
              يرجى التواصل مع موظف المطعم.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tables.map((table) => (
              <button
                key={table.public_token}
                type="button"
                onClick={() => handleSelect(table.public_token, table.label)}
                className="flex min-h-[88px] flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 hover:shadow-md active:scale-[0.98]"
              >
                <span className="text-2xl">🍽</span>
                <span className="mt-2 text-base font-bold text-stone-900">
                  {table.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={pending !== null}
        title="تغيير الطاولة؟"
        description="السلة تحتوي على أصناف لطاولة أخرى. سيتم إفراغها ولن تُنقل. هل تريد المتابعة؟"
        confirmLabel="تغيير الطاولة"
        tone="danger"
        onCancel={() => setPending(null)}
        onConfirm={confirmSwitch}
      />
    </div>
  );
}
