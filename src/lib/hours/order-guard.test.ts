import { describe, expect, it, vi } from "vitest";
import { OrderValidationError } from "@/lib/orders/validate-order";
import { assertRestaurantAcceptsCustomerOrders } from "@/lib/hours/order-guard";
import { CUSTOMER_ORDER_CLOSED_MESSAGE } from "@/lib/hours/restaurant-status";

describe("assertRestaurantAcceptsCustomerOrders", () => {
  it("rejects customer order while restaurant is closed", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                weekly_opening_hours: {
                  saturday: [],
                  sunday: [],
                  monday: [],
                  tuesday: [],
                  wednesday: [],
                  thursday: [],
                  friday: [],
                },
                is_temporarily_closed: true,
                temporary_closure_message: null,
                manual_hours_override: null,
                manual_hours_override_until: null,
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    await expect(
      assertRestaurantAcceptsCustomerOrders(
        supabase as never,
        new Date("2026-07-13T07:00:00.000Z")
      )
    ).rejects.toMatchObject({
      message: CUSTOMER_ORDER_CLOSED_MESSAGE,
      statusCode: 403,
    } satisfies Partial<OrderValidationError>);
  });

  it("allows customer order while restaurant is open", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                weekly_opening_hours: {
                  saturday: [],
                  sunday: [],
                  monday: [{ open: "10:00", close: "23:00" }],
                  tuesday: [],
                  wednesday: [],
                  thursday: [],
                  friday: [],
                },
                is_temporarily_closed: false,
                temporary_closure_message: null,
                manual_hours_override: null,
                manual_hours_override_until: null,
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    await expect(
      assertRestaurantAcceptsCustomerOrders(
        supabase as never,
        new Date("2026-07-13T07:00:00.000Z")
      )
    ).resolves.toBeUndefined();
  });
});
