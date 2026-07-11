import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrustedOrderPayload } from "@/lib/orders/rpc-payload";
import {
  buildTrustedOrderPayload,
  parseCreateOrderRpcResult,
} from "@/lib/orders/rpc-payload";

type FailStage = "item" | "add_on" | "print_job";

interface StoredOrder {
  id: string;
  order_number: string;
  submit_token: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  order_type: string;
  status: string;
}

/**
 * In-memory harness mirroring create_customer_order() transaction semantics.
 * Used to verify rollback and idempotency without a live database.
 */
class AtomicOrderHarness {
  private orders = new Map<string, StoredOrder>();
  private ordersByToken = new Map<string, StoredOrder>();
  private orderItems: { order_id: string; id: string }[] = [];
  private orderItemAddOns: { order_item_id: string }[] = [];
  private orderCharges: { order_id: string; charge_id: string | null }[] = [];
  private printJobs: { order_id: string }[] = [];
  private seq = 0;
  private mutex: Promise<void> = Promise.resolve();

  reset() {
    this.orders.clear();
    this.ordersByToken.clear();
    this.orderItems = [];
    this.orderItemAddOns = [];
    this.orderCharges = [];
    this.printJobs = [];
    this.seq = 0;
    this.mutex = Promise.resolve();
  }

  private withLock<T>(fn: () => Promise<T> | T): Promise<T> {
    const run = this.mutex.then(() => fn());
    this.mutex = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  async createCustomerOrder(
    payload: TrustedOrderPayload,
    options?: { failAt?: FailStage }
  ) {
    const existing = this.ordersByToken.get(payload.submit_token);
    if (existing) {
      return this.toResult(existing, true);
    }

    return this.withLock(async () => {
      const raced = this.ordersByToken.get(payload.submit_token);
      if (raced) {
        return this.toResult(raced, true);
      }

      const pendingOrder: StoredOrder = {
        id: crypto.randomUUID(),
        order_number: `080726-${String(++this.seq).padStart(3, "0")}`,
        submit_token: payload.submit_token,
        subtotal: payload.subtotal,
        delivery_fee: payload.delivery_fee,
        total: payload.total,
        order_type: payload.order_type,
        status: payload.status,
      };

      const pendingItems: { order_id: string; id: string }[] = [];
      const pendingAddOns: { order_item_id: string }[] = [];
      const pendingCharges: { order_id: string; charge_id: string | null }[] =
        [];
      let pendingPrintJob: { order_id: string } | null = null;

      try {
        for (const item of payload.items) {
          if (options?.failAt === "item") {
            throw new Error("simulated item insert failure");
          }

          const orderItemId = crypto.randomUUID();
          pendingItems.push({ order_id: pendingOrder.id, id: orderItemId });

          for (let i = 0; i < item.add_ons.length; i++) {
            if (options?.failAt === "add_on") {
              throw new Error("simulated add-on insert failure");
            }
            pendingAddOns.push({ order_item_id: orderItemId });
          }
        }

        for (const charge of payload.charges ?? []) {
          pendingCharges.push({
            order_id: pendingOrder.id,
            charge_id: charge.charge_id,
          });
        }

        if (options?.failAt === "print_job") {
          throw new Error("simulated print job insert failure");
        }

        pendingPrintJob = { order_id: pendingOrder.id };

        this.orders.set(pendingOrder.id, pendingOrder);
        this.ordersByToken.set(payload.submit_token, pendingOrder);
        this.orderItems.push(...pendingItems);
        this.orderItemAddOns.push(...pendingAddOns);
        this.orderCharges.push(...pendingCharges);
        if (pendingPrintJob) {
          this.printJobs.push(pendingPrintJob);
        }

        return this.toResult(pendingOrder, false);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("unique constraint")
        ) {
          const winner = this.ordersByToken.get(payload.submit_token);
          if (winner) {
            return this.toResult(winner, true);
          }
        }
        throw error;
      }
    });
  }

  counts() {
    return {
      orders: this.orders.size,
      items: this.orderItems.length,
      addOns: this.orderItemAddOns.length,
      charges: this.orderCharges.length,
      printJobs: this.printJobs.length,
    };
  }

  private toResult(order: StoredOrder, existing: boolean) {
    return {
      id: order.id,
      order_number: order.order_number,
      order_type: order.order_type,
      status: order.status,
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      total: order.total,
      existing,
    };
  }
}

const samplePayload = (): TrustedOrderPayload => ({
  submit_token: "00000000-0000-4000-8000-000000000099",
  order_type: "DINE_IN",
  status: "NEW",
  table_id: "00000000-0000-4000-8000-000000000010",
  table_label_snapshot: "طاولة 1",
  customer_name: null,
  customer_phone: null,
  customer_address: null,
  location_url: null,
  pickup_time: null,
  notes: null,
  subtotal: 2000,
  delivery_fee: 0,
  total: 2000,
  charges: [],
  items: [
    {
      product_id: "00000000-0000-4000-8000-000000000001",
      product_name_snapshot: "برجر",
      unit_price_snapshot: 1000,
      quantity: 2,
      line_total: 2000,
      notes: null,
      add_ons: [
        {
          add_on_id: "00000000-0000-4000-8000-000000000002",
          name_snapshot: "جبنة",
          price_snapshot: 200,
        },
      ],
    },
  ],
});

describe("create_customer_order SQL migration", () => {
  const sql = readFileSync(
    join(
      process.cwd(),
      "supabase/migrations/20260708150000_create_customer_order_rpc.sql"
    ),
    "utf8"
  );

  it("defines a single transactional RPC function", () => {
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.create_customer_order");
    expect(sql).toContain("INSERT INTO public.print_jobs");
    expect(sql).toContain("EXCEPTION");
    expect(sql).toContain("WHEN unique_violation");
  });

  it("restricts RPC to service_role only", () => {
    expect(sql).toContain(
      "REVOKE ALL ON FUNCTION public.create_customer_order(jsonb) FROM PUBLIC"
    );
    expect(sql).toContain(
      "REVOKE ALL ON FUNCTION public.create_customer_order(jsonb) FROM anon"
    );
    expect(sql).toContain(
      "REVOKE ALL ON FUNCTION public.create_customer_order(jsonb) FROM authenticated"
    );
    expect(sql).toContain(
      "GRANT EXECUTE ON FUNCTION public.create_customer_order(jsonb) TO service_role"
    );
  });
});

describe("create_customer_order charges migration", () => {
  const sql = readFileSync(
    join(
      process.cwd(),
      "supabase/migrations/20260711140100_order_rpc_charges.sql"
    ),
    "utf8"
  );

  it("persists order_charges snapshots in the RPC", () => {
    expect(sql).toContain("INSERT INTO public.order_charges");
    expect(sql).toContain("name_snapshot");
    expect(sql).toContain("calculated_amount");
    expect(sql).toContain("sort_order_snapshot");
  });
});

describe("atomic order transaction harness", () => {
  const harness = new AtomicOrderHarness();

  beforeEach(() => {
    harness.reset();
  });

  it("commits order, items, add-ons, and print job on success", async () => {
    const result = await harness.createCustomerOrder(samplePayload());

    expect(result.existing).toBe(false);
    expect(harness.counts()).toEqual({
      orders: 1,
      items: 1,
      addOns: 1,
      charges: 0,
      printJobs: 1,
    });
  });

  it("persists charge snapshots atomically with the order", async () => {
    const payload = samplePayload();
    payload.charges = [
      {
        charge_id: "00000000-0000-4000-8000-000000000020",
        name_snapshot: "إعمار",
        calculation_type_snapshot: "PERCENTAGE",
        value_snapshot: 1000,
        calculated_amount: 200,
        sort_order_snapshot: 0,
      },
    ];
    payload.total = 2200;

    await harness.createCustomerOrder(payload);

    expect(harness.counts().charges).toBe(1);
  });

  it("rolls back the order when an item insert fails", async () => {
    await expect(
      harness.createCustomerOrder(samplePayload(), { failAt: "item" })
    ).rejects.toThrow("simulated item insert failure");

    expect(harness.counts()).toEqual({
      orders: 0,
      items: 0,
      addOns: 0,
      charges: 0,
      printJobs: 0,
    });
  });

  it("rolls back everything when an add-on insert fails", async () => {
    await expect(
      harness.createCustomerOrder(samplePayload(), { failAt: "add_on" })
    ).rejects.toThrow("simulated add-on insert failure");

    expect(harness.counts()).toEqual({
      orders: 0,
      items: 0,
      addOns: 0,
      charges: 0,
      printJobs: 0,
    });
  });

  it("rolls back everything when print job insert fails", async () => {
    await expect(
      harness.createCustomerOrder(samplePayload(), { failAt: "print_job" })
    ).rejects.toThrow("simulated print job insert failure");

    expect(harness.counts()).toEqual({
      orders: 0,
      items: 0,
      addOns: 0,
      charges: 0,
      printJobs: 0,
    });
  });

  it("returns the existing order for duplicate submit_token", async () => {
    const first = await harness.createCustomerOrder(samplePayload());
    const second = await harness.createCustomerOrder(samplePayload());

    expect(second.existing).toBe(true);
    expect(second.id).toBe(first.id);
    expect(second.order_number).toBe(first.order_number);
    expect(second.total).toBe(first.total);
    expect(harness.counts().orders).toBe(1);
  });

  it("creates only one order for concurrent duplicate submit_token requests", async () => {
    const payload = samplePayload();
    const [first, second] = await Promise.all([
      harness.createCustomerOrder(payload),
      harness.createCustomerOrder(payload),
    ]);

    const created = [first, second].filter((r) => !r.existing);
    const existing = [first, second].filter((r) => r.existing);

    expect(created).toHaveLength(1);
    expect(existing).toHaveLength(1);
    expect(first.id).toBe(second.id);
    expect(harness.counts().orders).toBe(1);
  });
});

describe("trusted RPC payload", () => {
  it("builds server-side snapshots without trusting client totals", () => {
    const payload = buildTrustedOrderPayload({
      submit_token: "00000000-0000-4000-8000-000000000099",
      order_type: "DINE_IN",
      status: "NEW",
      tableId: "00000000-0000-4000-8000-000000000010",
      tableLabelSnapshot: "طاولة 1",
      lines: [
        {
          product_id: "00000000-0000-4000-8000-000000000001",
          product_name_snapshot: "برجر",
          unit_price_snapshot: 1000,
          quantity: 2,
          line_total: 2000,
          notes: null,
          add_ons: [],
        },
      ],
      subtotal: 2000,
      deliveryFee: 0,
      total: 2000,
    });

    expect(payload.total).toBe(2000);
    expect(payload.items[0].product_name_snapshot).toBe("برجر");
  });

  it("parses RPC result including existing flag", () => {
    const parsed = parseCreateOrderRpcResult({
      id: "00000000-0000-4000-8000-000000000050",
      order_number: "080726-001",
      order_type: "DINE_IN",
      status: "NEW",
      subtotal: 2000,
      delivery_fee: 0,
      total: 2000,
      existing: true,
    });

    expect(parsed.existing).toBe(true);
  });
});

describe("createCustomerOrder service", () => {
  const rpcMock = vi.fn();
  const fromMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    rpcMock.mockReset();
    fromMock.mockReset();

    vi.doMock("@/lib/supabase/service", () => ({
      createServiceClient: () => ({
        rpc: rpcMock,
        from: fromMock,
      }),
    }));
  });

  it("calls create_customer_order RPC with trusted payload only", async () => {
    const trustedPayload = samplePayload();

    vi.doMock("@/lib/orders/validate-order", () => ({
      OrderValidationError: class OrderValidationError extends Error {},
      validateAndBuildTrustedPayload: vi.fn().mockResolvedValue({
        currency_label: "ل.س",
        trustedPayload,
      }),
    }));

    rpcMock.mockResolvedValue({
      data: {
        id: "00000000-0000-4000-8000-000000000050",
        order_number: "080726-001",
        order_type: "DINE_IN",
        status: "NEW",
        subtotal: 2000,
        delivery_fee: 0,
        total: 2000,
        existing: false,
      },
      error: null,
    });

    const { createCustomerOrder } = await import("@/lib/orders/create-order");
    const result = await createCustomerOrder({
      submit_token: trustedPayload.submit_token,
      order_type: "DINE_IN",
      table_token: "a".repeat(32),
      items: [
        {
          product_id: "00000000-0000-4000-8000-000000000001",
          quantity: 2,
          add_on_ids: [],
        },
      ],
    });

    expect(rpcMock).toHaveBeenCalledWith("create_customer_order", {
      p_payload: trustedPayload,
    });
    expect(result.existing).toBeUndefined();
    expect(result.order_number).toBe("080726-001");
    expect(result.currency_label).toBe("ل.س");
  });

  it("returns existing order metadata when RPC reports duplicate submit_token", async () => {
    const trustedPayload = samplePayload();

    vi.doMock("@/lib/orders/validate-order", () => ({
      OrderValidationError: class OrderValidationError extends Error {},
      validateAndBuildTrustedPayload: vi.fn().mockResolvedValue({
        currency_label: "ل.س",
        trustedPayload,
      }),
    }));

    rpcMock.mockResolvedValue({
      data: {
        id: "00000000-0000-4000-8000-000000000050",
        order_number: "080726-001",
        order_type: "DINE_IN",
        status: "NEW",
        subtotal: 2000,
        delivery_fee: 0,
        total: 2000,
        existing: true,
      },
      error: null,
    });

    const { createCustomerOrder } = await import("@/lib/orders/create-order");
    const result = await createCustomerOrder({
      submit_token: trustedPayload.submit_token,
      order_type: "DINE_IN",
      table_token: "a".repeat(32),
      items: [
        {
          product_id: "00000000-0000-4000-8000-000000000001",
          quantity: 2,
          add_on_ids: [],
        },
      ],
    });

    expect(result.existing).toBe(true);
    expect(result.id).toBe("00000000-0000-4000-8000-000000000050");
    expect(result.total).toBe(2000);
  });

  it("throws when RPC fails so no partial order is exposed", async () => {
    vi.doMock("@/lib/orders/validate-order", () => ({
      OrderValidationError: class OrderValidationError extends Error {
        statusCode = 500;
      },
      validateAndBuildTrustedPayload: vi.fn().mockResolvedValue({
        currency_label: "ل.س",
        trustedPayload: samplePayload(),
      }),
    }));

    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "insert failed" },
    });

    const { createCustomerOrder, OrderValidationError } = await import(
      "@/lib/orders/create-order"
    );

    await expect(
      createCustomerOrder({
        submit_token: "00000000-0000-4000-8000-000000000099",
        order_type: "DINE_IN",
        table_token: "a".repeat(32),
        items: [
          {
            product_id: "00000000-0000-4000-8000-000000000001",
            quantity: 1,
            add_on_ids: [],
          },
        ],
      })
    ).rejects.toBeInstanceOf(OrderValidationError);
  });
});
