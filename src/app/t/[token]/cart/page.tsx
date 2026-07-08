import { fetchPublicMenu, fetchTableByToken } from "@/lib/menu/public-menu";
import { InvalidTablePage } from "@/components/customer/dine-in-shell";
import { DineInCartClient } from "@/components/customer/dine-in-cart-client";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function DineInCartPage({ params }: PageProps) {
  const { token } = await params;
  const table = await fetchTableByToken(token);

  if (!table || !table.is_active) {
    return <InvalidTablePage />;
  }

  const menu = await fetchPublicMenu();
  return (
    <DineInCartClient
      menu={menu}
      ctx={{
        flow: "legacy",
        tableToken: token,
        tableLabel: table.label,
      }}
    />
  );
}
