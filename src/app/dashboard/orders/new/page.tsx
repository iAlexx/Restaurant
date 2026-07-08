import { requireStaffPage } from "@/lib/auth/staff-page";
import { listActiveTablesForManualOrder } from "@/lib/actions/orders";
import { fetchPublicMenu } from "@/lib/menu/public-menu";
import { ManualOrderForm } from "@/components/dashboard/manual-order-form";

export default async function NewManualOrderPage() {
  await requireStaffPage("/dashboard/orders/new");

  const [menu, tables] = await Promise.all([
    fetchPublicMenu(),
    listActiveTablesForManualOrder(),
  ]);

  return <ManualOrderForm menu={menu} tables={tables} />;
}
