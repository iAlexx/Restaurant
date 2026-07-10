"use client";

import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { ToggleActiveButton } from "@/components/dashboard/toggle-active-button";
import {
  deleteAddOn,
  getAddOnDeletePreview,
  toggleAddOnAvailableForm,
} from "@/lib/actions/add-ons";

export function AddOnRowActions({
  addOnId,
  addOnName,
  isAvailable,
}: {
  addOnId: string;
  addOnName: string;
  isAvailable: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleActiveButton
        action={toggleAddOnAvailableForm}
        entityId={addOnId}
        isActive={isAvailable}
        activeLabel="إيقاف"
        inactiveLabel="تفعيل"
      />
      <DeleteEntityButton
        entityId={addOnId}
        entityName={addOnName}
        previewAction={getAddOnDeletePreview}
        deleteAction={deleteAddOn}
        compact
      />
    </div>
  );
}
