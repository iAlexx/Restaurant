import { describe, expect, it } from "vitest";
import { buildOrderSummaryLines } from "@/lib/orders/order-summary";

describe("buildOrderSummaryLines", () => {
  it("maps items and add-ons into summary lines", () => {
    const lines = buildOrderSummaryLines(
      [
        {
          id: "item-1",
          product_name_snapshot: "شاورما",
          unit_price_snapshot: 5000,
          quantity: 2,
          line_total: 10000,
          notes: "بدون بصل",
        },
      ],
      [
        {
          order_item_id: "item-1",
          name_snapshot: "جبنة",
          price_snapshot: 500,
        },
      ]
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.name).toBe("شاورما");
    expect(lines[0]?.addOns).toEqual([{ name: "جبنة", price: 500 }]);
    expect(lines[0]?.notes).toBe("بدون بصل");
  });
});
