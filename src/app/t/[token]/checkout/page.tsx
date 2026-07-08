import { fetchPublicMenu, fetchTableByToken } from "@/lib/menu/public-menu";
import { InvalidTablePage } from "@/components/customer/dine-in-shell";
import { DineInCheckoutClient } from "@/components/customer/dine-in-cart-client";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function DineInCheckoutPage({ params }: PageProps) {
  const { token } = await params;
  const table = await fetchTableByToken(token);

  if (!table || !table.is_active) {
    return <InvalidTablePage />;
  }

  const menu = await fetchPublicMenu();
  return <DineInCheckoutClient menu={menu} tableToken={token} />;
}
