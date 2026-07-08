import { fetchPublicMenu } from "@/lib/menu/public-menu";
import { requireUnifiedDineInTable } from "@/lib/dine-in/resolve-table";
import { DineInCartClient } from "@/components/customer/dine-in-cart-client";

interface PageProps {
  searchParams: Promise<{ table?: string | string[] }>;
}

export default async function UnifiedDineInCartPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const table = await requireUnifiedDineInTable(params.table);
  const menu = await fetchPublicMenu();

  return (
    <DineInCartClient
      menu={menu}
      ctx={{
        flow: "unified",
        tableToken: table.public_token,
        tableLabel: table.label,
      }}
    />
  );
}
