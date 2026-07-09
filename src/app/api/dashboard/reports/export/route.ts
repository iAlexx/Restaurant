import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth/session";
import { getTodayOrdersExportForStaff } from "@/lib/actions/reports";
import { buildTodayOrdersCsv } from "@/lib/reports/csv-export";
import { getRestaurantLocalDateString } from "@/lib/time/restaurant-date";

export async function GET() {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const rows = await getTodayOrdersExportForStaff();
    const csv = buildTodayOrdersCsv(rows);
    const date = getRestaurantLocalDateString();

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${date}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "تعذر تصدير الطلبات" }, { status: 500 });
  }
}
