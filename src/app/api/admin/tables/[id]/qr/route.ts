import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireAdminSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/env";
import type { Table } from "@/types/database";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await context.params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tables")
    .select("label, public_token")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "الطاولة غير موجودة" }, { status: 404 });
  }

  const table = data as Pick<Table, "label" | "public_token">;
  const url = `${getSiteUrl()}/t/${table.public_token}`;
  const pngBuffer = await QRCode.toBuffer(url, {
    type: "png",
    width: 400,
    margin: 2,
  });

  const filename = `table-${table.label.replace(/\s+/g, "-")}-qr.png`;

  return new NextResponse(new Uint8Array(pngBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
