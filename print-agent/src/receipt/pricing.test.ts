import { describe, expect, it } from "vitest";
import { buildTestReceipt } from "./format.js";
import {
  addOnLineTotal,
  computeAddOnsLineTotal,
  computeExpectedLineTotal,
  computeExpectedOrderTotal,
  computeExpectedSubtotal,
  verifyReceiptItem,
  verifyReceiptPayload,
} from "./pricing.js";

describe("receipt pricing from snapshots", () => {
  it("product without add-ons", () => {
    expect(computeExpectedLineTotal(12334, 2, [])).toBe(24668);
  });

  it("product with one add-on", () => {
    expect(computeExpectedLineTotal(12334, 2, [500])).toBe(25668);
  });

  it("product with multiple add-ons", () => {
    expect(computeExpectedLineTotal(12334, 2, [500, 250])).toBe(26168);
  });

  it("add-ons multiplied by quantity", () => {
    expect(addOnLineTotal(500, 2)).toBe(1000);
    expect(computeAddOnsLineTotal([500, 250], 2)).toBe(1500);
  });

  it("multiple products with add-ons", () => {
    const items = [
      { unit_price: 12334, quantity: 2, line_total: 26168, add_ons: [{ price: 500 }, { price: 250 }] },
      { unit_price: 5000, quantity: 1, line_total: 5500, add_ons: [{ price: 500 }] },
    ];
    expect(computeExpectedSubtotal(items)).toBe(31668);
  });

  it("delivery fee included once in final total", () => {
    expect(computeExpectedOrderTotal(26168, 2000)).toBe(28168);
  });

  it("subtotal equals sum of item totals", () => {
    const receipt = buildTestReceipt();
    expect(receipt.subtotal).toBe(
      receipt.items.reduce((s, i) => s + i.line_total, 0)
    );
  });

  it("final total equals subtotal + delivery fee", () => {
    const receipt = buildTestReceipt();
    expect(receipt.total).toBe(
      receipt.subtotal + receipt.delivery_fee + receipt.charges.reduce((s, c) => s + c.amount, 0)
    );
  });

  it("receipt total matches stored order total for sample", () => {
    const receipt = buildTestReceipt();
    expect(verifyReceiptPayload(receipt)).toEqual([]);
    expect(receipt.items[0].line_total).toBe(26168);
    expect(receipt.total).toBe(31285);
  });

  it("order snapshots remain source of truth (line_total not recomputed from menu)", () => {
    const item = {
      unit_price: 9999,
      quantity: 1,
      line_total: 12345,
      add_ons: [{ price: 2346 }],
    };
    expect(verifyReceiptItem(item)).toBeNull();
    expect(computeExpectedLineTotal(9999, 1, [2346])).toBe(12345);
  });

  it("rejects negative add-on prices", () => {
    expect(
      verifyReceiptItem({
        unit_price: 1000,
        quantity: 1,
        line_total: 1000,
        add_ons: [{ price: -1 }],
      })
    ).toBe("invalid add-on price");
  });

  it("rejects mismatched line total", () => {
    expect(
      verifyReceiptItem({
        unit_price: 12334,
        quantity: 2,
        line_total: 24668,
        add_ons: [{ price: 500 }],
      })
    ).toContain("line total 24668 != expected");
  });

  it("duplicate add-on unit prices are summed per business rules", () => {
    expect(computeExpectedLineTotal(1000, 1, [200, 200])).toBe(1400);
  });

  it("verifyReceiptPayload catches inconsistent order totals", () => {
    const receipt = buildTestReceipt();
    receipt.total = 1;
    expect(verifyReceiptPayload(receipt).length).toBeGreaterThan(0);
  });
});
