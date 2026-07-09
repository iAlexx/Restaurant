import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth/session";
import { listOrdersForStaff } from "@/lib/actions/orders";
import { getOperationalSummaryForStaff } from "@/lib/actions/reports";
import { orderListFilterSchema } from "@/lib/validations/order-status";

export async function GET(request: Request) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filterParam = searchParams.get("filter") ?? "all";
  const parsed = orderListFilterSchema.safeParse(filterParam);

  if (!parsed.success) {
    return NextResponse.json({ error: "فلتر غير صالح" }, { status: 400 });
  }

  try {
    const [orders, summary] = await Promise.all([
      listOrdersForStaff(parsed.data),
      getOperationalSummaryForStaff(),
    ]);
    return NextResponse.json({ orders, summary });
  } catch {
    return NextResponse.json({ error: "تعذر تحميل الطلبات" }, { status: 500 });
  }
}
