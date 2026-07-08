import { fetchPublicMenu, fetchTableByToken } from "@/lib/menu/public-menu";
import {
  DineInMenuClient,
  InvalidTablePage,
} from "@/components/customer/dine-in-shell";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function DineInPage({ params }: PageProps) {
  const { token } = await params;
  const table = await fetchTableByToken(token);

  if (!table || !table.is_active) {
    return <InvalidTablePage />;
  }

  const menu = await fetchPublicMenu();

  return (
    <DineInMenuClient
      menu={menu}
      ctx={{
        flow: "legacy",
        tableToken: token,
        tableLabel: table.label,
      }}
    />
  );
}
