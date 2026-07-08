import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth/session";
import { getOrderDetailForStaff } from "@/lib/actions/orders";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const detail = await getOrderDetailForStaff(id);
    if (!detail) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch {
    return NextResponse.json({ error: "تعذر تحميل الطلب" }, { status: 500 });
  }
}
