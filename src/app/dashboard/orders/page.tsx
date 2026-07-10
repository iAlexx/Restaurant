import { requireStaffPage } from "@/lib/auth/staff-page";
import {
  getPrintDeviceHealthForStaff,
  listOrdersForStaff,
} from "@/lib/actions/orders";
import { getOperationalSummaryForStaff } from "@/lib/actions/reports";
import { createClient } from "@/lib/supabase/server";
import { OrdersDashboard } from "@/components/dashboard/orders-dashboard";

export default async function OrdersPage() {
  await requireStaffPage("/dashboard/orders");

  const [orders, summary, settings, printDevices] = await Promise.all([
    listOrdersForStaff("all"),
    getOperationalSummaryForStaff(),
    createClient()
      .then((supabase) =>
        supabase
          .from("restaurant_settings")
          .select("currency_label")
          .eq("id", 1)
          .single()
      ),
    getPrintDeviceHealthForStaff(),
  ]);

  const currencyLabel =
    (settings.data as { currency_label: string } | null)?.currency_label ?? "ل.س";

  return (
    <OrdersDashboard
      initialOrders={orders}
      initialSummary={summary}
      currencyLabel={currencyLabel}
      printDevices={printDevices}
    />
  );
}
