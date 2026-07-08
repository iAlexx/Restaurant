import { requireStaffPage } from "@/lib/auth/staff-page";
import { listOrdersForStaff } from "@/lib/actions/orders";
import { createClient } from "@/lib/supabase/server";
import { OrdersDashboard } from "@/components/dashboard/orders-dashboard";

export default async function OrdersPage() {
  await requireStaffPage("/dashboard/orders");

  const [orders, settings] = await Promise.all([
    listOrdersForStaff("all"),
    createClient()
      .then((supabase) =>
        supabase
          .from("restaurant_settings")
          .select("currency_label")
          .eq("id", 1)
          .single()
      ),
  ]);

  const currencyLabel =
    (settings.data as { currency_label: string } | null)?.currency_label ?? "ل.س";

  return (
    <OrdersDashboard initialOrders={orders} currencyLabel={currencyLabel} />
  );
}
