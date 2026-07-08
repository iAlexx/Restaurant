import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticatePrintDevice } from "@/lib/print-agent/auth";
import { failPrintJob } from "@/lib/print-agent/service";

const failBodySchema = z.object({
  error_message: z.string().min(1).max(500).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const device = await authenticatePrintDevice(request);
  if (!device) {
    return NextResponse.json({ error: "رمز الجهاز غير صالح أو ملغى" }, { status: 401 });
  }

  const { jobId } = await params;
  const parsedId = z.string().uuid().safeParse(jobId);
  if (!parsedId.success) {
    return NextResponse.json({ error: "معرف المهمة غير صالح" }, { status: 400 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsedBody = failBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  try {
    const updated = await failPrintJob(
      parsedId.data,
      device.id,
      parsedBody.data.error_message ?? "فشل الطباعة"
    );

    if (!updated) {
      return NextResponse.json(
        { error: "لا يمكن تسجيل فشل هذه المهمة — ربما طالب بها جهاز آخر" },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Print fail failed:", error);
    return NextResponse.json({ error: "تعذر تسجيل فشل الطباعة" }, { status: 500 });
  }
}
