import { describe, expect, it } from "vitest";
import { formatPrice, ltrIsolate } from "./format.js";

describe("receipt format", () => {
  it("formats money with western digits and currency label", () => {
    expect(formatPrice(1233, "ل.س")).toBe("\u20661,233 ل.س\u2069");
  });

  it("isolates order numbers for RTL receipts", () => {
    expect(ltrIsolate("100726-010")).toBe("\u2066100726-010\u2069");
  });
});
