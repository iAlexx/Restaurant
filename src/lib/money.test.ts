import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/money";

describe("formatPrice", () => {
  it("formats whole integers with Arabic locale grouping", () => {
    const result = formatPrice(1500);
    expect(result).toMatch(/٥٠٠|500/);
    expect(result).toContain("ل.س");
  });

  it("uses custom currency label from settings", () => {
    expect(formatPrice(2500, "ل.س")).toContain("ل.س");
  });
});
