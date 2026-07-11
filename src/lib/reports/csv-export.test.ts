import { describe, expect, it } from "vitest";
import { buildTodayOrdersCsv } from "@/lib/reports/csv-export";

describe("buildTodayOrdersCsv", () => {
  it("includes UTF-8 BOM and Arabic headers", () => {
    const csv = buildTodayOrdersCsv([
      {
        order_number: "1001",
        order_type: "DINE_IN",
        status: "NEW",
        subtotal: 4500,
        delivery_fee: 0,
        charges_total: 450,
        total: 4950,
        created_at: "2026-07-09T10:00:00.000Z",
      },
    ]);

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("رقم الطلب");
    expect(csv).toContain("المجموع الفرعي");
    expect(csv).toContain("إجمالي الرسوم");
    expect(csv).toContain("1001");
    expect(csv).toContain("4950");
  });
});
