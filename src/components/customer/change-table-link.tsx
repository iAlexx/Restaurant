"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { clearCachedDineInTable } from "@/lib/dine-in/session-table";

export function ChangeTableLink({
  className = "",
}: {
  className?: string;
}) {
  const router = useRouter();
  const { itemCount, clearCart } = useCart();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function proceed() {
    clearCart();
    clearCachedDineInTable();
    setConfirmOpen(false);
    router.push("/dine-in");
  }

  function handleClick() {
    if (itemCount > 0) {
      setConfirmOpen(true);
      return;
    }
    proceed();
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={className || "text-sm font-medium text-brand-orange underline"}
      >
        تغيير الطاولة
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="تغيير الطاولة؟"
        description="السلة تحتوي على أصناف. سيتم إفراغها ولن تُنقل إلى الطاولة الجديدة. هل تريد المتابعة؟"
        confirmLabel="تغيير الطاولة"
        tone="danger"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={proceed}
      />
    </>
  );
}
