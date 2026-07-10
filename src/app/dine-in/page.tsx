import { fetchActiveTables, fetchPublicMenu } from "@/lib/menu/public-menu";
import { TableSelectionScreen } from "@/components/customer/table-selection-screen";
import { DineInLandingGate } from "@/components/customer/dine-in-landing-gate";
import { redirect } from "next/navigation";
import { resolveUnifiedDineInTable } from "@/lib/dine-in/resolve-table";
import { unifiedDineInHref } from "@/lib/dine-in/paths";

interface PageProps {
  searchParams: Promise<{ table?: string | string[] }>;
}

export default async function UnifiedDineInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const table = await resolveUnifiedDineInTable(params.table);
  if (table) {
    redirect(unifiedDineInHref("menu", table.public_token));
  }

  const [menu, tables] = await Promise.all([
    fetchPublicMenu(),
    fetchActiveTables(),
  ]);

  return (
    <DineInLandingGate settings={menu.settings}>
      <TableSelectionScreen settings={menu.settings} tables={tables} />
    </DineInLandingGate>
  );
}
