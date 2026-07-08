import { NextResponse } from "next/server";
import { authenticatePrintDevice } from "@/lib/print-agent/auth";
import { claimPrintJob } from "@/lib/print-agent/service";

export async function POST(request: Request) {
  const device = await authenticatePrintDevice(request);
  if (!device) {
    return NextResponse.json({ error: "رمز الجهاز غير صالح أو ملغى" }, { status: 401 });
  }

  try {
    const claim = await claimPrintJob(device.id);
    if (!claim) {
      return NextResponse.json({ job: null });
    }

    return NextResponse.json({ job: claim });
  } catch (error) {
    console.error("Print claim failed:", error);
    return NextResponse.json({ error: "تعذر المطالبة بمهمة الطباعة" }, { status: 500 });
  }
}
