import { fetchPublicMenu } from "@/lib/menu/public-menu";
import { ExternalOrderPageClient } from "@/components/customer/external-order-client";

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function ExternalOrderPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const menu = await fetchPublicMenu();

  const orderType =
    params.type === "DELIVERY" || params.type === "PICKUP"
      ? params.type
      : null;

  if (orderType === "DELIVERY" && !menu.settings.delivery_enabled) {
    return <ExternalOrderPageClient menu={menu} orderType={null} />;
  }
  if (orderType === "PICKUP" && !menu.settings.pickup_enabled) {
    return <ExternalOrderPageClient menu={menu} orderType={null} />;
  }

  return <ExternalOrderPageClient menu={menu} orderType={orderType} />;
}
