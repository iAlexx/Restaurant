import { fetchPublicMenu } from "@/lib/menu/public-menu";
import { ExternalOrderPageClient } from "@/components/customer/external-order-client";
import { RestaurantSplashGate } from "@/components/customer/restaurant-splash-gate";

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
    return (
      <RestaurantSplashGate logoUrl={menu.settings.logo_url}>
        <ExternalOrderPageClient menu={menu} orderType={null} />
      </RestaurantSplashGate>
    );
  }
  if (orderType === "PICKUP" && !menu.settings.pickup_enabled) {
    return (
      <RestaurantSplashGate logoUrl={menu.settings.logo_url}>
        <ExternalOrderPageClient menu={menu} orderType={null} />
      </RestaurantSplashGate>
    );
  }

  return (
    <RestaurantSplashGate logoUrl={menu.settings.logo_url}>
      <ExternalOrderPageClient menu={menu} orderType={orderType} />
    </RestaurantSplashGate>
  );
}
