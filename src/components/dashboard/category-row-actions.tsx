"use client";

import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { ToggleActiveButton } from "@/components/dashboard/toggle-active-button";
import {
  deleteCategory,
  getCategoryDeletePreview,
  toggleCategoryActiveForm,
} from "@/lib/actions/categories";

export function CategoryRowActions({
  categoryId,
  categoryName,
  isActive,
}: {
  categoryId: string;
  categoryName: string;
  isActive: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleActiveButton
        action={toggleCategoryActiveForm}
        entityId={categoryId}
        isActive={isActive}
      />
      <DeleteEntityButton
        entityId={categoryId}
        entityName={categoryName}
        previewAction={getCategoryDeletePreview}
        deleteAction={deleteCategory}
        compact
      />
    </div>
  );
}
