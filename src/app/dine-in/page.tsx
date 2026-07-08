import { fetchActiveTables, fetchPublicMenu } from "@/lib/menu/public-menu";
import { TableSelectionScreen } from "@/components/customer/table-selection-screen";

export default async function UnifiedDineInPage() {
  const [menu, tables] = await Promise.all([
    fetchPublicMenu(),
    fetchActiveTables(),
  ]);

  return <TableSelectionScreen settings={menu.settings} tables={tables} />;
}
