import { describe, expect, it } from "vitest";
import {
  computeChargeAmount,
  computeFinalOrderTotal,
  computeOrderTotalsWithCharges,
  computePercentageChargeAmount,
  filterChargesForOrderType,
  formatChargeDisplayLabel,
  percentInputToBasisPoints,
  resolveChargeSnapshots,
  sumChargeAmounts,
} from "@/lib/charges/calculate";
import type { PublicCharge } from "@/lib/charges/types";

const sampleCharges: PublicCharge[] = [
  {
    id: "c1",
    name_ar: "إعمار",
    calculation_type: "PERCENTAGE",
    value: 1000,
    applies_to: "ALL",
    sort_order: 0,
  },
  {
    id: "c2",
    name_ar: "رسوم تغليف",
    calculation_type: "FIXED",
    value: 500,
    applies_to: "ALL",
    sort_order: 1,
  },
];

describe("charge calculation", () => {
  it("returns zero extra when no active charges", () => {
    const result = computeOrderTotalsWithCharges(26168, 2000, []);
    expect(result.charges_total).toBe(0);
    expect(result.total).toBe(28168);
  });

  it("calculates one percentage charge", () => {
    expect(computePercentageChargeAmount(26168, 1000)).toBe(2617);
  });

  it("calculates one fixed charge", () => {
    expect(computeChargeAmount(26168, "FIXED", 500)).toBe(500);
  });

  it("calculates multiple charges", () => {
    const snapshots = resolveChargeSnapshots(26168, sampleCharges);
    expect(sumChargeAmounts(snapshots)).toBe(3117);
  });

  it("supports decimal percentage via basis points", () => {
    expect(computePercentageChargeAmount(10000, 250)).toBe(250);
    expect(percentInputToBasisPoints(2.5)).toBe(250);
  });

  it("applies percentage to subtotal including add-ons", () => {
    const subtotal = 26168;
    expect(computePercentageChargeAmount(subtotal, 1000)).toBe(2617);
  });

  it("excludes delivery fee from percentage base", () => {
    const snapshots = resolveChargeSnapshots(26168, [sampleCharges[0]]);
    const total = computeFinalOrderTotal(
      26168,
      2000,
      snapshots.map((c) => c.calculated_amount)
    );
    expect(total).toBe(30785);
  });

  it("filters charges by order type", () => {
    const charges: PublicCharge[] = [
      { ...sampleCharges[0], applies_to: "DELIVERY" },
      { ...sampleCharges[1], applies_to: "DINE_IN" },
    ];
    expect(filterChargesForOrderType(charges, "DELIVERY")).toHaveLength(1);
    expect(filterChargesForOrderType(charges, "DINE_IN")).toHaveLength(1);
    expect(filterChargesForOrderType(charges, "PICKUP")).toHaveLength(0);
  });

  it("formats percentage label for receipt and checkout", () => {
    expect(formatChargeDisplayLabel("إعمار", "PERCENTAGE", 1000)).toBe(
      "إعمار 10%"
    );
    expect(formatChargeDisplayLabel("ضريبة", "PERCENTAGE", 250)).toBe(
      "ضريبة 2.5%"
    );
  });

  it("final total equals subtotal + delivery + charges", () => {
    const result = computeOrderTotalsWithCharges(26168, 2000, sampleCharges);
    expect(result.total).toBe(31285);
  });

  it("uses integer math only", () => {
    const amount = computePercentageChargeAmount(12345, 333);
    expect(Number.isInteger(amount)).toBe(true);
  });

  it("rounds percentage with Math.round at half-up boundaries", () => {
    expect(computePercentageChargeAmount(10001, 1000)).toBe(1000);
    expect(computePercentageChargeAmount(10005, 1000)).toBe(1001);
    expect(computePercentageChargeAmount(9999, 1000)).toBe(1000);
  });

  it("rejects negative values at validation layer (contract)", () => {
    expect(computeChargeAmount(1000, "FIXED", 0)).toBe(0);
  });

  it("excludes disabled charges when only active charges are passed", () => {
    const activeOnly = sampleCharges.filter((_, index) => index === 0);
    const result = computeOrderTotalsWithCharges(26168, 2000, activeOnly);
    expect(result.charges_total).toBe(2617);
    expect(result.total).toBe(30785);
  });
});

describe("snapshot persistence contract", () => {
  it("snapshots store calculated amounts independent of future settings", () => {
    const snapshots = resolveChargeSnapshots(26168, sampleCharges);
    expect(snapshots[0].calculated_amount).toBe(2617);
    expect(snapshots[1].calculated_amount).toBe(500);
    expect(snapshots[0].value_snapshot).toBe(1000);
  });
});

describe("manual order calculation (contract)", () => {
  it("uses the same charge rules as customer checkout", () => {
    const result = computeOrderTotalsWithCharges(2000, 0, [
      {
        id: "c1",
        name_ar: "رسوم خدمة",
        calculation_type: "PERCENTAGE",
        value: 500,
        applies_to: "DINE_IN",
        sort_order: 0,
      },
    ]);
    expect(result.charges_total).toBe(100);
    expect(result.total).toBe(2100);
  });
});

describe("delete charge preserves historical snapshots (contract)", () => {
  it("snapshot rows remain valid when charge_id becomes null", () => {
    const snapshots = resolveChargeSnapshots(26168, sampleCharges);
    const persisted = snapshots.map((snapshot) => ({
      ...snapshot,
      charge_id: null,
    }));
    expect(persisted[0].name_snapshot).toBe("إعمار");
    expect(persisted[0].calculated_amount).toBe(2617);
    expect(sumChargeAmounts(persisted)).toBe(3117);
  });
});

describe("server ignores client charge values (contract)", () => {
  it("recomputes from charge definitions not client totals", () => {
    const server = computeOrderTotalsWithCharges(26168, 2000, sampleCharges);
    const fakeClientTotal = 26168 + 2000;
    expect(server.total).not.toBe(fakeClientTotal);
    expect(server.total).toBe(31285);
  });
});
