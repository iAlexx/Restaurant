import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("DeleteEntityButton", () => {
  it("renders destructive delete label in closed state", () => {
    const html = renderToStaticMarkup(
      <DeleteEntityButton
        entityId="00000000-0000-4000-8000-000000000001"
        entityName="برجر"
        previewAction={async () => ({
          canDelete: true,
          entityName: "برger",
          dependencyLines: [],
          requireTypedConfirmation: false,
        })}
        deleteAction={async () => ({ success: "ok" })}
        compact
      />
    );

    expect(html).toContain("حذف");
    expect(html).toContain("text-red-600");
  });
});
