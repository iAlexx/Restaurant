import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  order_id: z.string().uuid(),
  expected_status: z.enum([
    "NEW",
    "WAITING_WHATSAPP_CONFIRMATION",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "COMPLETED",
    "CANCELLED",
  ]),
  new_status: z.enum([
    "NEW",
    "WAITING_WHATSAPP_CONFIRMATION",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "COMPLETED",
    "CANCELLED",
  ]),
});

export const cancelOrderSchema = z.object({
  order_id: z.string().uuid(),
  expected_status: z.enum([
    "NEW",
    "WAITING_WHATSAPP_CONFIRMATION",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "COMPLETED",
    "CANCELLED",
  ]),
  cancellation_reason: z
    .string()
    .min(3, "سبب الإلغاء مطلوب")
    .max(500, "سبب الإلغاء طويل جداً"),
});

export const reprintOrderSchema = z.object({
  order_id: z.string().uuid(),
});

export type OrderListFilter =
  | "all"
  | "NEW"
  | "WAITING_WHATSAPP_CONFIRMATION"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED"
  | "DINE_IN"
  | "DELIVERY"
  | "PICKUP";

export const orderListFilterSchema = z.enum([
  "all",
  "NEW",
  "WAITING_WHATSAPP_CONFIRMATION",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
  "DINE_IN",
  "DELIVERY",
  "PICKUP",
]);
