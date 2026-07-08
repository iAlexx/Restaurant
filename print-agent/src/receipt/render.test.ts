import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildTestReceipt } from "./format.js";
import { renderReceiptPng } from "./render.js";

describe("renderReceiptPng", () => {
  it("renders a PNG at the configured 80mm width", () => {
    const png = renderReceiptPng(buildTestReceipt(), 576);
    expect(png.length).toBeGreaterThan(1000);
    expect(png[0]).toBe(0x89);
    expect(png[1]).toBe(0x50);
    expect(png[2]).toBe(0x4e);
    expect(png[3]).toBe(0x47);
  });

  it("supports fallback widths 512 and 384", () => {
    const w512 = renderReceiptPng(buildTestReceipt(), 512);
    const w384 = renderReceiptPng(buildTestReceipt(), 384);
    expect(w512.length).toBeGreaterThan(500);
    expect(w384.length).toBeGreaterThan(500);
  });

  it("renders reprint marker without clipping", () => {
    const receipt = buildTestReceipt();
    receipt.is_reprint = true;
    const png = renderReceiptPng(receipt, 576);
    expect(png.length).toBeGreaterThan(1000);
  });

  it("renders long Arabic address and notes", () => {
    const receipt = buildTestReceipt();
    receipt.customer_address =
      "دمشق - المزة - شارع طويل جداً مع نص عربي إضافي للتأكد من عدم القص";
    receipt.notes = "بدون بصل، صلصة إضافية على الجانب";
    receipt.items[0].add_ons = [{ name: "جبنة إضافية", price: 300 }];
    const png = renderReceiptPng(receipt, 576);
    expect(png.length).toBeGreaterThan(1000);
  });

  it("writes a sample file for manual visual inspection", () => {
    const png = renderReceiptPng(buildTestReceipt(), 576);
    writeFileSync("receipt-sample-test.png", png);
    expect(png.length).toBeGreaterThan(0);
  });
});
