import { redirect } from "next/navigation";
import {
  fetchTableByToken,
  type PublicTable,
} from "@/lib/menu/public-menu";
import { parseUnifiedTableParam } from "@/lib/dine-in/paths";

/** Resolve + validate table from unified ?table= query (server-side). */
export async function resolveUnifiedDineInTable(
  tableParam: string | string[] | undefined
): Promise<PublicTable | null> {
  const token = parseUnifiedTableParam(tableParam);
  if (!token) return null;

  const table = await fetchTableByToken(token);
  if (!table || !table.is_active) return null;
  return table;
}

export async function requireUnifiedDineInTable(
  tableParam: string | string[] | undefined
): Promise<PublicTable> {
  const table = await resolveUnifiedDineInTable(tableParam);
  if (!table) redirect("/dine-in");
  return table;
}
