import { describe, expect, it, vi, beforeEach } from "vitest";
import { hashToken } from "@/lib/tokens";
import { buildReceiptPayloadFromSnapshots } from "@/lib/print-agent/receipt";
import {
  claimPrintJob,
  completePrintJob,
  failPrintJob,
  releaseClaimedPrintJob,
  resetStalePrintJobs,
  STALE_PRINTING_MS,
} from "@/lib/print-agent/service";
import { extractBearerToken } from "@/lib/print-agent/auth";

const rpcMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    rpc: rpcMock,
    from: fromMock,
  }),
}));

describe("extractBearerToken", () => {
  it("extracts bearer token", () => {
    const request = new Request("http://localhost", {
      headers: { Authorization: "Bearer abc123" },
    });
    expect(extractBearerToken(request)).toBe("abc123");
  });

  it("returns null for missing header", () => {
    expect(extractBearerToken(new Request("http://localhost"))).toBeNull();
  });
});

describe("device token hashing", () => {
  it("hashes token consistently", () => {
    const token = "test-device-token";
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
  });
});

describe("stale PRINTING recovery", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    fromMock.mockReset();
  });

  it("exposes 2 minute stale threshold", () => {
    expect(STALE_PRINTING_MS).toBe(120_000);
  });

  it("calls reset_stale_print_jobs RPC", async () => {
    rpcMock.mockResolvedValueOnce({ data: 2, error: null });
    const count = await resetStalePrintJobs();
    expect(count).toBe(2);
    expect(rpcMock).toHaveBeenCalledWith("reset_stale_print_jobs");
  });
});

describe("atomic claim", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    fromMock.mockReset();
  });

  it("returns null when no pending jobs", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    const result = await claimPrintJob("device-1");
    expect(result).toBeNull();
  });

  it("builds receipt payload from database snapshots only", async () => {
    const orderId = "00000000-0000-4000-8000-000000000010";
    const jobId = "00000000-0000-4000-8000-000000000020";

    fromMock.mockImplementation((table: string) => {
      if (table === "orders") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id: orderId,
                  order_number: "080726-001",
                  order_type: "DINE_IN",
                  table_label_snapshot: "طاولة 1",
                  customer_name: null,
                  customer_phone: null,
                  customer_address: null,
                  location_url: null,
                  pickup_time: null,
                  notes: null,
                  subtotal: 1000,
                  delivery_fee: 0,
                  total: 1000,
                  created_at: "2026-07-08T10:00:00.000Z",
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "order_items") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                data: [
                  {
                    id: "item-1",
                    product_name_snapshot: "برجر",
                    unit_price_snapshot: 1000,
                    quantity: 1,
                    line_total: 1000,
                    notes: null,
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "restaurant_settings") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  name: "مطعمي",
                  receipt_header: "أهلاً",
                  receipt_footer: "شكراً",
                  currency_label: "ل.س",
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "order_item_add_ons") {
        return {
          select: () => ({
            in: async () => ({ data: [], error: null }),
          }),
        };
      }
      if (table === "order_charges") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: [], error: null }),
            }),
          }),
        };
      }
      return { select: () => ({}) };
    });

    const receipt = await buildReceiptPayloadFromSnapshots(
      { from: fromMock } as never,
      { jobId, orderId, isReprint: true }
    );

    expect(receipt.is_reprint).toBe(true);
    expect(receipt.items[0].name).toBe("برجر");
    expect(receipt.restaurant_name).toBe("مطعمي");
    expect(receipt.total).toBe(1000);
  });
});

describe("job completion authorization", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("marks success only for claiming device", async () => {
    rpcMock.mockResolvedValueOnce({ data: true, error: null });
    const ok = await completePrintJob("job-1", "device-1");
    expect(ok).toBe(true);
    expect(rpcMock).toHaveBeenCalledWith("complete_print_job", {
      p_job_id: "job-1",
      p_device_id: "device-1",
    });
  });

  it("treats repeated success acknowledgement as success", async () => {
    rpcMock.mockResolvedValueOnce({ data: true, error: null });
    const first = await completePrintJob("job-1", "device-1");
    rpcMock.mockResolvedValueOnce({ data: true, error: null });
    const second = await completePrintJob("job-1", "device-1");
    expect(first).toBe(true);
    expect(second).toBe(true);
  });

  it("rejects wrong device completing job", async () => {
    rpcMock.mockResolvedValueOnce({ data: false, error: null });
    const ok = await completePrintJob("job-1", "device-2");
    expect(ok).toBe(false);
  });

  it("marks fail with error message", async () => {
    rpcMock.mockResolvedValueOnce({ data: true, error: null });
    const ok = await failPrintJob("job-1", "device-1", "فشل الطباعة");
    expect(ok).toBe(true);
    expect(rpcMock).toHaveBeenCalledWith("fail_print_job", {
      p_job_id: "job-1",
      p_device_id: "device-1",
      p_error_message: "فشل الطباعة",
    });
  });
});

describe("reprint marker in receipt payload", () => {
  it("includes is_reprint flag from claim", async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        job_id: "00000000-0000-4000-8000-000000000020",
        order_id: "00000000-0000-4000-8000-000000000010",
        is_reprint: true,
      },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === "print_jobs") {
        return {
          update: () => ({
            eq: () => ({
              eq: () => ({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          }),
        };
      }

      const chain = {
        select: () => chain,
        eq: () => chain,
        single: async () => ({
          data:
            table === "orders"
              ? {
                  id: "00000000-0000-4000-8000-000000000010",
                  order_number: "080726-002",
                  order_type: "DELIVERY",
                  table_label_snapshot: null,
                  customer_name: "أحمد",
                  customer_phone: "0999",
                  customer_address: "دمشق",
                  location_url: null,
                  pickup_time: null,
                  notes: null,
                  subtotal: 2000,
                  delivery_fee: 500,
                  total: 2500,
                  created_at: "2026-07-08T10:00:00.000Z",
                }
              : {
                  name: "مطعمي",
                  receipt_header: null,
                  receipt_footer: null,
                  currency_label: "ل.س",
                },
          error: null,
        }),
        order: async () => ({
          data:
            table === "order_items"
              ? [
                  {
                    id: "item-1",
                    product_name_snapshot: "بيتزا",
                    unit_price_snapshot: 2000,
                    quantity: 1,
                    line_total: 2000,
                    notes: null,
                  },
                ]
              : [],
          error: null,
        }),
        in: async () => ({ data: [], error: null }),
      };
      return chain;
    });

    const claim = await claimPrintJob("device-1");
    expect(claim?.is_reprint).toBe(true);
    expect(claim?.receipt.is_reprint).toBe(true);
  });
});

describe("receipt assembly failure recovery", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    fromMock.mockReset();
  });

  it("releases claimed job when receipt assembly fails", async () => {
    const jobId = "00000000-0000-4000-8000-000000000020";
    const orderId = "00000000-0000-4000-8000-000000000010";

    rpcMock.mockResolvedValueOnce({
      data: {
        job_id: jobId,
        order_id: orderId,
        is_reprint: false,
      },
      error: null,
    });

    const updateEqMock = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockImplementation((table: string) => {
      if (table === "print_jobs") {
        return {
          update: () => ({
            eq: () => ({
              eq: () => ({
                eq: updateEqMock,
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { message: "missing" } }),
          }),
        }),
      };
    });

    await expect(claimPrintJob("device-1")).rejects.toThrow();
    expect(updateEqMock).toHaveBeenCalled();
  });

  it("releaseClaimedPrintJob resets PRINTING job to PENDING", async () => {
    const updateEqMock = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockImplementation(() => ({
      update: () => ({
        eq: () => ({
          eq: () => ({
            eq: updateEqMock,
          }),
        }),
      }),
    }));

    await releaseClaimedPrintJob("job-1", "device-1");
    expect(updateEqMock).toHaveBeenCalled();
  });
});
