import { NextResponse } from "next/server";
import { authenticatePrintDevice } from "@/lib/print-agent/auth";
import { printAgentHeartbeat } from "@/lib/print-agent/service";

export async function POST(request: Request) {
  const device = await authenticatePrintDevice(request);
  if (!device) {
    return NextResponse.json({ error: "رمز الجهاز غير صالح أو ملغى" }, { status: 401 });
  }

  try {
    await printAgentHeartbeat(device.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Print heartbeat failed:", error);
    return NextResponse.json({ error: "تعذر إرسال نبضة الجهاز" }, { status: 500 });
  }
}
