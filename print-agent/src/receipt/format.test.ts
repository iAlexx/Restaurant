import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  formatMoneyLTR,
  formatOrderNumberLTR,
  formatQuantityLTR,
  toAsciiDigits,
} from "./format.js";
import {
  FONT_ARABIC,
  FONT_NUMERIC,
  getFontRegistrationStatus,
  registerReceiptFonts,
} from "./fonts.js";

const fontsDir = fileURLToPath(new URL("../../assets/fonts", import.meta.url));

describe("receipt format", () => {
  it("formats money with western digits only", () => {
    expect(formatMoneyLTR(1233, "ل.س")).toEqual({
      amount: "1,233",
      currency: "ل.س",
    });
  });

  it("formats order numbers as ASCII", () => {
    expect(formatOrderNumberLTR("100726-010")).toBe("100726-010");
  });

  it("converts Arabic-Indic digits to ASCII", () => {
    expect(toAsciiDigits("١٢٣")).toBe("123");
  });

  it("strips bidi marks from numeric strings", () => {
    expect(toAsciiDigits("\u2066123\u2069")).toBe("123");
  });

  it("formats quantity without bidi marks", () => {
    expect(formatQuantityLTR(2)).toBe("2");
    expect(formatQuantityLTR(2)).not.toMatch(/[\u200E\u200F\u2066-\u2069]/);
  });
});

describe("receipt fonts", () => {
  it("bundled TTF font files exist", () => {
    expect(existsSync(join(fontsDir, "Cairo-Variable.ttf"))).toBe(true);
    expect(existsSync(join(fontsDir, "Numeric-Regular.ttf"))).toBe(true);
  });

  it("registers Arabic and numeric fonts successfully", () => {
    const status = registerReceiptFonts();
    expect(status.ok).toBe(true);
    expect(status.arabic).toBe(true);
    expect(status.numeric).toBe(true);
    expect(status.errors).toEqual([]);
    expect(getFontRegistrationStatus().ok).toBe(true);
  });

  it("registers expected font families", () => {
    registerReceiptFonts();
    const status = getFontRegistrationStatus();
    expect(status.paths.arabic).toContain("Cairo-Variable.ttf");
    expect(status.paths.numeric).toBeTruthy();
  });
});
