"use client";

import { useTransition } from "react";
import { buttonSecondaryClassName } from "@/components/dashboard/form-ui";

interface ToggleActiveButtonProps {
  isActive: boolean;
  onToggle: (next: boolean) => Promise<{ error?: string; success?: string }>;
  activeLabel?: string;
  inactiveLabel?: string;
}

export function ToggleActiveButton({
  isActive,
  onToggle,
  activeLabel = "إيقاف",
  inactiveLabel = "تفعيل",
}: ToggleActiveButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={buttonSecondaryClassName()}
      onClick={() =>
        startTransition(async () => {
          await onToggle(!isActive);
        })
      }
    >
      {pending ? "..." : isActive ? activeLabel : inactiveLabel}
    </button>
  );
}
