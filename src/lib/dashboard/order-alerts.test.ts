import { describe, expect, it, vi } from "vitest";
import {
  collectNewUrgentOrderIds,
  countUrgentOrders,
  isUrgentOrderStatus,
  seedAlertedUrgentOrderIds,
} from "@/lib/dashboard/order-alerts";
import type { OrderStatus } from "@/types/database";

describe("order-alerts", () => {
  it("identifies urgent statuses", () => {
    expect(isUrgentOrderStatus("NEW")).toBe(true);
    expect(isUrgentOrderStatus("WAITING_WHATSAPP_CONFIRMATION")).toBe(true);
    expect(isUrgentOrderStatus("PREPARING")).toBe(false);
  });

  it("counts urgent orders", () => {
    const orders = [
      { status: "NEW" as OrderStatus },
      { status: "PREPARING" as OrderStatus },
      { status: "WAITING_WHATSAPP_CONFIRMATION" as OrderStatus },
    ];
    expect(countUrgentOrders(orders)).toBe(2);
  });

  it("alerts only once per urgent order id", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    });

    seedAlertedUrgentOrderIds(["a"]);
    expect(
      collectNewUrgentOrderIds([
        { id: "a", status: "NEW" },
        { id: "b", status: "NEW" },
      ])
    ).toEqual(["b"]);
    expect(
      collectNewUrgentOrderIds([
        { id: "a", status: "NEW" },
        { id: "b", status: "NEW" },
      ])
    ).toEqual([]);
  });
});
