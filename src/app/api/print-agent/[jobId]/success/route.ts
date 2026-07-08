import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticatePrintDevice } from "@/lib/print-agent/auth";
import { completePrintJob } from "@/lib/print-agent/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const device = await authenticatePrintDevice(request);
  if (!device) {
    return NextResponse.json({ error: "رمز الجهاز غير صالح أو ملغى" }, { status: 401 });
  }

  const { jobId } = await params;
  const parsed = z.string().uuid().safeParse(jobId);
  if (!parsed.success) {
    return NextResponse.json({ error: "معرف المهمة غير صالح" }, { status: 400 });
  }

  try {
    const updated = await completePrintJob(parsed.data, device.id);
    if (!updated) {
      return NextResponse.json(
        { error: "لا يمكن إكمال هذه المهمة — ربما طالب بها جهاز آخر" },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Print success failed:", error);
    return NextResponse.json({ error: "تعذر تأكيد الطباعة" }, { status: 500 });
  }
}
