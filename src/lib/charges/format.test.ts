import { describe, expect, it } from "vitest";
import {
  chargeAppliesToLabel,
  chargeTypeLabel,
  chargeValueLabel,
} from "@/lib/charges/format";

describe("charge format helpers", () => {
  it("formats percentage from basis points", () => {
    expect(
      chargeValueLabel({ calculation_type: "PERCENTAGE", value: 1000 })
    ).toBe("10%");
    expect(
      chargeValueLabel({ calculation_type: "PERCENTAGE", value: 250 })
    ).toBe("2.5%");
  });

  it("formats fixed charge with currency", () => {
    const label = chargeValueLabel({ calculation_type: "FIXED", value: 500 });
    expect(label).toMatch(/500|٥٠٠/);
    expect(label).toContain("ل.س");
  });

  it("formats charge type labels", () => {
    expect(chargeTypeLabel("PERCENTAGE")).toBe("نسبة مئوية");
    expect(chargeTypeLabel("FIXED")).toBe("مبلغ ثابت");
  });

  it("formats applies-to labels", () => {
    expect(chargeAppliesToLabel("ALL")).toBe("جميع الطلبات");
    expect(chargeAppliesToLabel("DELIVERY")).toBe("توصيل");
  });
});
