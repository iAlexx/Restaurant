import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import { describe, expect, it } from "vitest";
import { buildTestReceipt } from "./format.js";
import { FONT_NUMERIC, registerReceiptFonts, renderFontDiagnosticPng } from "./fonts.js";
import { renderReceiptPng } from "./render.js";

const releaseDir = fileURLToPath(new URL("../../release", import.meta.url));

function probeNumericGlyphWidth(text: string): number {
  registerReceiptFonts();
  const canvas = createCanvas(400, 80);
  const ctx = canvas.getContext("2d");
  ctx.font = `28px "${FONT_NUMERIC}"`;
  ctx.direction = "ltr";
  return ctx.measureText(text).width;
}

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

  it("numeric font renders non-zero widths for receipt values", () => {
    expect(probeNumericGlyphWidth("100726-010")).toBeGreaterThan(40);
    expect(probeNumericGlyphWidth("1,233")).toBeGreaterThan(20);
    expect(probeNumericGlyphWidth("12,334")).toBeGreaterThan(30);
    expect(probeNumericGlyphWidth("2")).toBeGreaterThan(5);
  });

  it("writes receipt and font diagnostic samples for visual inspection", () => {
    const receiptPng = renderReceiptPng(buildTestReceipt(), 576);
    const diagnosticPng = renderFontDiagnosticPng();

    writeFileSync("receipt-sample-test.png", receiptPng);
    writeFileSync("receipt-font-diagnostic.png", diagnosticPng);
    mkdirSync(releaseDir, { recursive: true });
    writeFileSync(join(releaseDir, "receipt-sample-test.png"), receiptPng);
    writeFileSync(join(releaseDir, "receipt-font-diagnostic.png"), diagnosticPng);

    expect(receiptPng.length).toBeGreaterThan(0);
    expect(diagnosticPng.length).toBeGreaterThan(0);
  });
});
