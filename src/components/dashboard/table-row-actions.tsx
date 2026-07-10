"use client";

import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { ToggleActiveButton } from "@/components/dashboard/toggle-active-button";
import { TableQrActions } from "@/components/dashboard/table-qr-actions";
import {
  deleteTable,
  getTableDeletePreview,
  toggleTableActiveForm,
} from "@/lib/actions/tables";

export function TableRowActions({
  tableId,
  tableLabel,
  isActive,
}: {
  tableId: string;
  tableLabel: string;
  isActive: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <TableQrActions tableId={tableId} />
      <ToggleActiveButton
        action={toggleTableActiveForm}
        entityId={tableId}
        isActive={isActive}
      />
      <DeleteEntityButton
        entityId={tableId}
        entityName={tableLabel}
        previewAction={getTableDeletePreview}
        deleteAction={deleteTable}
        compact
      />
    </div>
  );
}
