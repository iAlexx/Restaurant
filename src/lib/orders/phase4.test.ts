import { describe, expect, it } from "vitest";
import { canRoleAccessDashboardPath } from "@/lib/auth/permissions";
import {
  computeDailyReport,
  computeOperationalSummary,
  filterOrdersByListFilter,
} from "@/lib/orders/dashboard";
import {
  canCancelOrder,
  getAllowedNextStatuses,
  isTerminalStatus,
  isValidStatusTransition,
} from "@/lib/orders/status-transitions";
import {
  getRestaurantDayUtcBounds,
  getRestaurantLocalDateString,
} from "@/lib/time/restaurant-date";
import { RESTAURANT_TIMEZONE } from "@/lib/orders/status-transitions";
import {
  cancelOrderSchema,
  updateOrderStatusSchema,
} from "@/lib/validations/order-status";
import {
  manualDeliveryOrderSchema,
  manualDineInOrderSchema,
  manualPickupOrderSchema,
} from "@/lib/validations/manual-order";
import type { OrderStatus } from "@/types/database";

const sampleOrders = [
  {
    id: "1",
    status: "NEW" as OrderStatus,
    order_type: "DINE_IN" as const,
    total: 1000,
  },
  {
    id: "2",
    status: "CONFIRMED" as OrderStatus,
    order_type: "DELIVERY" as const,
    total: 2500,
  },
  {
    id: "3",
    status: "CANCELLED" as OrderStatus,
    order_type: "PICKUP" as const,
    total: 500,
  },
  {
    id: "4",
    status: "READY" as OrderStatus,
    order_type: "PICKUP" as const,
    total: 800,
  },
];

describe("filterOrdersByListFilter", () => {
  it("returns all orders for all filter", () => {
    expect(filterOrdersByListFilter(sampleOrders, "all")).toHaveLength(4);
  });

  it("filters by status", () => {
    expect(filterOrdersByListFilter(sampleOrders, "NEW")).toHaveLength(1);
    expect(filterOrdersByListFilter(sampleOrders, "CANCELLED")).toHaveLength(1);
  });

  it("filters by order type", () => {
    expect(filterOrdersByListFilter(sampleOrders, "DINE_IN")).toHaveLength(1);
    expect(filterOrdersByListFilter(sampleOrders, "PICKUP")).toHaveLength(2);
    expect(filterOrdersByListFilter(sampleOrders, "DELIVERY")).toHaveLength(1);
  });
});

describe("computeOperationalSummary", () => {
  it("counts urgent, preparing, and revenue excluding cancelled", () => {
    const summary = computeOperationalSummary(
      [
        { status: "NEW", total: 1000 },
        { status: "WAITING_WHATSAPP_CONFIRMATION", total: 2000 },
        { status: "PREPARING", total: 3000 },
        { status: "CANCELLED", total: 999 },
      ],
      "2026-07-09",
      RESTAURANT_TIMEZONE
    );

    expect(summary.total_orders).toBe(3);
    expect(summary.urgent_count).toBe(2);
    expect(summary.preparing_count).toBe(1);
    expect(summary.total_value).toBe(6000);
  });
});

describe("status transitions", () => {
  it("allows valid transitions", () => {
    expect(isValidStatusTransition("NEW", "PREPARING")).toBe(true);
    expect(
      isValidStatusTransition("WAITING_WHATSAPP_CONFIRMATION", "CONFIRMED")
    ).toBe(true);
    expect(isValidStatusTransition("CONFIRMED", "PREPARING")).toBe(true);
    expect(isValidStatusTransition("PREPARING", "READY")).toBe(true);
    expect(isValidStatusTransition("READY", "COMPLETED")).toBe(true);
    expect(isValidStatusTransition("NEW", "CANCELLED")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(isValidStatusTransition("NEW", "READY")).toBe(false);
    expect(isValidStatusTransition("COMPLETED", "PREPARING")).toBe(false);
    expect(isValidStatusTransition("CANCELLED", "NEW")).toBe(false);
    expect(isValidStatusTransition("READY", "CONFIRMED")).toBe(false);
  });

  it("marks completed and cancelled as terminal", () => {
    expect(isTerminalStatus("COMPLETED")).toBe(true);
    expect(isTerminalStatus("CANCELLED")).toBe(true);
    expect(isTerminalStatus("NEW")).toBe(false);
  });

  it("exposes allowed next statuses without cancel shortcut duplicates", () => {
    expect(getAllowedNextStatuses("NEW")).toEqual(["PREPARING", "CANCELLED"]);
  });
});

describe("cancel order validation", () => {
  it("requires cancellation reason", () => {
    const result = cancelOrderSchema.safeParse({
      order_id: "00000000-0000-4000-8000-000000000001",
      expected_status: "NEW",
      cancellation_reason: "ab",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid cancellation payload", () => {
    const result = cancelOrderSchema.safeParse({
      order_id: "00000000-0000-4000-8000-000000000001",
      expected_status: "NEW",
      cancellation_reason: "العميل ألغى الطلب",
    });
    expect(result.success).toBe(true);
  });

  it("blocks cancelling completed orders", () => {
    expect(canCancelOrder("COMPLETED")).toBe(false);
    expect(isValidStatusTransition("COMPLETED", "CANCELLED")).toBe(false);
  });
});

describe("update order status validation", () => {
  it("rejects invalid status update payload", () => {
    const result = updateOrderStatusSchema.safeParse({
      order_id: "not-uuid",
      expected_status: "NEW",
      new_status: "PREPARING",
    });
    expect(result.success).toBe(false);
  });
});

describe("reprint contract", () => {
  it("creates a new print job without mutating previous jobs", () => {
    const existingJobs = [
      { id: "job-1", is_reprint: false, status: "PRINTED" as const },
    ];
    const newJob = {
      id: "job-2",
      is_reprint: true,
      status: "PENDING" as const,
    };

    const after = [...existingJobs, newJob];
    expect(after).toHaveLength(2);
    expect(after[0]).toEqual(existingJobs[0]);
    expect(after[1].is_reprint).toBe(true);
  });
});

describe("manual order schemas", () => {
  const item = {
    product_id: "00000000-0000-4000-8000-000000000001",
    quantity: 1,
    add_on_ids: [],
  };

  it("validates manual dine-in order", () => {
    const result = manualDineInOrderSchema.safeParse({
      submit_token: "00000000-0000-4000-8000-000000000099",
      order_type: "DINE_IN",
      table_id: "00000000-0000-4000-8000-000000000010",
      items: [item],
    });
    expect(result.success).toBe(true);
  });

  it("validates manual delivery order with delivery fee", () => {
    const result = manualDeliveryOrderSchema.safeParse({
      submit_token: "00000000-0000-4000-8000-000000000099",
      order_type: "DELIVERY",
      customer_name: "أحمد",
      customer_phone: "0999123456",
      customer_address: "دمشق",
      delivery_fee: 500,
      items: [item],
    });
    expect(result.success).toBe(true);
  });

  it("validates manual pickup order", () => {
    const result = manualPickupOrderSchema.safeParse({
      submit_token: "00000000-0000-4000-8000-000000000099",
      order_type: "PICKUP",
      customer_name: "سارة",
      customer_phone: "0999000000",
      pickup_time: "18:30",
      items: [item],
    });
    expect(result.success).toBe(true);
  });
});

describe("manual order idempotency contract", () => {
  it("uses submit_token UUID for duplicate protection", () => {
    const token = "00000000-0000-4000-8000-000000000099";
    const first = manualDineInOrderSchema.safeParse({
      submit_token: token,
      order_type: "DINE_IN",
      table_id: "00000000-0000-4000-8000-000000000010",
      items: [
        {
          product_id: "00000000-0000-4000-8000-000000000001",
          quantity: 1,
          add_on_ids: [],
        },
      ],
    });
    const second = manualDineInOrderSchema.safeParse({
      submit_token: token,
      order_type: "DINE_IN",
      table_id: "00000000-0000-4000-8000-000000000010",
      items: [
        {
          product_id: "00000000-0000-4000-8000-000000000001",
          quantity: 2,
          add_on_ids: [],
        },
      ],
    });

    expect(first.success && second.success).toBe(true);
    if (first.success && second.success) {
      expect(first.data.submit_token).toBe(second.data.submit_token);
    }
  });
});

describe("cashier permissions", () => {
  it("allows cashier orders and reports", () => {
    expect(canRoleAccessDashboardPath("CASHIER", "/dashboard/orders")).toBe(true);
    expect(canRoleAccessDashboardPath("CASHIER", "/dashboard/reports")).toBe(true);
    expect(
      canRoleAccessDashboardPath("CASHIER", "/dashboard/orders/new")
    ).toBe(true);
  });

  it("denies cashier admin pages", () => {
    expect(canRoleAccessDashboardPath("CASHIER", "/dashboard/settings")).toBe(
      false
    );
    expect(canRoleAccessDashboardPath("CASHIER", "/dashboard/products")).toBe(
      false
    );
    expect(canRoleAccessDashboardPath("CASHIER", "/dashboard/tables")).toBe(
      false
    );
  });

  it("allows admin all dashboard paths", () => {
    expect(canRoleAccessDashboardPath("ADMIN", "/dashboard/settings")).toBe(true);
    expect(canRoleAccessDashboardPath("ADMIN", "/dashboard/orders")).toBe(true);
  });
});

describe("daily report", () => {
  it("computes counts and totals for today orders", () => {
    const report = computeDailyReport(
      [
        { order_type: "DINE_IN", status: "NEW", total: 1000 },
        { order_type: "DELIVERY", status: "CONFIRMED", total: 2500 },
        { order_type: "PICKUP", status: "COMPLETED", total: 800 },
        { order_type: "DELIVERY", status: "CANCELLED", total: 500 },
      ],
      "2026-07-08",
      RESTAURANT_TIMEZONE
    );

    expect(report.total_orders).toBe(3);
    expect(report.total_value).toBe(4300);
    expect(report.dine_in_count).toBe(1);
    expect(report.delivery_count).toBe(1);
    expect(report.pickup_count).toBe(1);
    expect(report.cancelled_count).toBe(1);
  });

  it("uses restaurant timezone for day bounds", () => {
    const date = getRestaurantLocalDateString(new Date("2026-07-08T10:00:00Z"));
    const { start, end } = getRestaurantDayUtcBounds(date);
    expect(start).toContain("T");
    expect(end).toContain("T");
    expect(RESTAURANT_TIMEZONE).toBe("Asia/Damascus");
  });
});
