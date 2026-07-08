import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireAdminSession } from "@/lib/auth/session";
import { buildDineInUrl } from "@/lib/env";

export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const url = buildDineInUrl();
  const pngBuffer = await QRCode.toBuffer(url, {
    type: "png",
    width: 1024,
    margin: 2,
    errorCorrectionLevel: "Q",
    color: { dark: "#1c1917", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(pngBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'attachment; filename="restaurant-dine-in-qr.png"',
    },
  });
}
