"use client";

import { useFormStatus } from "react-dom";
import { buttonSecondaryClassName } from "@/components/dashboard/form-ui";

interface ToggleActiveButtonProps {
  /** Server Action (form-shaped). Passed as a reference, never a closure. */
  action: (formData: FormData) => void | Promise<void>;
  entityId: string;
  isActive: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

function ToggleSubmit({
  isActive,
  activeLabel,
  inactiveLabel,
}: {
  isActive: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonSecondaryClassName()}
    >
      {pending ? "..." : isActive ? activeLabel : inactiveLabel}
    </button>
  );
}

export function ToggleActiveButton({
  action,
  entityId,
  isActive,
  activeLabel = "إيقاف",
  inactiveLabel = "تفعيل",
}: ToggleActiveButtonProps) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={entityId} />
      <input type="hidden" name="next" value={(!isActive).toString()} />
      <ToggleSubmit
        isActive={isActive}
        activeLabel={activeLabel}
        inactiveLabel={inactiveLabel}
      />
    </form>
  );
}
