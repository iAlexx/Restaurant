import { describe, expect, it } from "vitest";
import {
  computeLineTotal,
  computeOrderTotals,
  getInitialOrderStatus,
} from "@/lib/orders/calculations";
import {
  createOrderSchema,
  deliveryOrderSchema,
  dineInOrderSchema,
} from "@/lib/validations/order";
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp/message";
import { checkRateLimit } from "@/lib/rate-limit";

describe("computeLineTotal", () => {
  it("includes add-on prices in line total", () => {
    expect(computeLineTotal(1000, 2, [200, 100])).toBe(2600);
  });

  it("matches receipt sample arithmetic", () => {
    expect(computeLineTotal(12334, 2, [500, 250])).toBe(26168);
  });
});

describe("computeOrderTotals", () => {
  it("adds delivery fee and charges to subtotal", () => {
    const result = computeOrderTotals(
      [
        {
          product_id: "p1",
          product_name_snapshot: "برجر",
          unit_price_snapshot: 1000,
          quantity: 2,
          line_total: 2000,
          notes: null,
          add_ons: [],
        },
      ],
      500,
      [
        {
          charge_id: "c1",
          name_snapshot: "إعمار",
          calculation_type_snapshot: "PERCENTAGE",
          value_snapshot: 1000,
          calculated_amount: 200,
          sort_order_snapshot: 0,
        },
      ]
    );
    expect(result.subtotal).toBe(2000);
    expect(result.delivery_fee).toBe(500);
    expect(result.charges_total).toBe(200);
    expect(result.total).toBe(2700);
  });
});

describe("getInitialOrderStatus", () => {
  it("returns NEW for dine-in", () => {
    expect(getInitialOrderStatus("DINE_IN")).toBe("NEW");
  });

  it("returns WAITING_WHATSAPP_CONFIRMATION for delivery", () => {
    expect(getInitialOrderStatus("DELIVERY")).toBe(
      "WAITING_WHATSAPP_CONFIRMATION"
    );
  });
});

describe("createOrderSchema", () => {
  const validItem = {
    product_id: "00000000-0000-4000-8000-000000000001",
    quantity: 1,
    add_on_ids: [],
  };

  it("validates dine-in order", () => {
    const result = dineInOrderSchema.safeParse({
      submit_token: "00000000-0000-4000-8000-000000000099",
      order_type: "DINE_IN",
      table_token: "a".repeat(32),
      items: [validItem],
    });
    expect(result.success).toBe(true);
  });

  it("validates delivery order", () => {
    const result = deliveryOrderSchema.safeParse({
      submit_token: "00000000-0000-4000-8000-000000000099",
      order_type: "DELIVERY",
      customer_name: "أحمد",
      customer_phone: "0999123456",
      customer_address: "دمشق - المزة",
      items: [validItem],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid location URL", () => {
    const result = deliveryOrderSchema.safeParse({
      submit_token: "00000000-0000-4000-8000-000000000099",
      order_type: "DELIVERY",
      customer_name: "أحمد",
      customer_phone: "0999123456",
      customer_address: "دمشق",
      location_url: "not-a-url",
      items: [validItem],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty cart", () => {
    const result = createOrderSchema.safeParse({
      submit_token: "00000000-0000-4000-8000-000000000099",
      order_type: "DINE_IN",
      table_token: "a".repeat(32),
      items: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("buildWhatsAppMessage", () => {
  it("builds Arabic message from order snapshots", () => {
    const message = buildWhatsAppMessage(
      {
        order_number: "080726-001",
        order_type: "DELIVERY",
        customer_name: "أحمد",
        customer_phone: "0999123456",
        customer_address: "دمشق",
        location_url: null,
        pickup_time: null,
        notes: null,
        subtotal: 2000,
        delivery_fee: 500,
        total: 2500,
        table_label_snapshot: null,
      },
      [
        {
          id: "item-1",
          product_name_snapshot: "برجر",
          unit_price_snapshot: 2000,
          quantity: 1,
          line_total: 2000,
          notes: null,
        },
      ],
      [],
      "ل.س"
    );

    expect(message).toContain("080726-001");
    expect(message).toContain("أحمد");
    expect(message).toContain("برجر");
    expect(message).toContain("توصيل");
  });
});

describe("buildWhatsAppUrl", () => {
  it("encodes Arabic message for wa.me", () => {
    const url = buildWhatsAppUrl("963999123456", "مرحبا طلب");
    expect(url).toContain("wa.me/963999123456");
    expect(url).toContain(encodeURIComponent("مرحبا طلب"));
  });
});

describe("checkRateLimit", () => {
  it("allows requests under limit", () => {
    const key = `test-${Date.now()}`;
    expect(checkRateLimit(key).allowed).toBe(true);
    expect(checkRateLimit(key).allowed).toBe(true);
  });
});
