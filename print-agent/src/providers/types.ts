import { z } from "zod";

export const receiptChargeSchema = z.object({
  label: z.string(),
  amount: z.number().int().min(0),
  sort_order: z.number().int().min(0),
});

export const receiptItemSchema = z.object({
  name: z.string(),
  quantity: z.number().int().positive(),
  unit_price: z.number().int().min(0),
  line_total: z.number().int().min(0),
  notes: z.string().nullable(),
  add_ons: z.array(
    z.object({
      name: z.string(),
      price: z.number().int().min(0),
    })
  ),
});

export const receiptPayloadSchema = z.object({
  job_id: z.string().uuid(),
  is_reprint: z.boolean(),
  restaurant_name: z.string(),
  receipt_header: z.string().nullable(),
  receipt_footer: z.string().nullable(),
  currency_label: z.string(),
  order_number: z.string(),
  order_type: z.enum(["DINE_IN", "DELIVERY", "PICKUP"]),
  order_type_label: z.string(),
  table_label: z.string().nullable(),
  customer_name: z.string().nullable(),
  customer_phone: z.string().nullable(),
  customer_address: z.string().nullable(),
  location_url: z.string().nullable(),
  pickup_time: z.string().nullable(),
  notes: z.string().nullable(),
  items: z.array(receiptItemSchema).min(1),
  subtotal: z.number().int().min(0),
  delivery_fee: z.number().int().min(0),
  charges: z.array(receiptChargeSchema).default([]),
  total: z.number().int().min(0),
  created_at: z.string(),
});

export type ReceiptPayload = z.infer<typeof receiptPayloadSchema>;

export const claimResponseSchema = z.object({
  job_id: z.string().uuid(),
  order_id: z.string().uuid(),
  is_reprint: z.boolean(),
  receipt: receiptPayloadSchema,
});

export type ClaimResponse = z.infer<typeof claimResponseSchema>;

export type PrinterStatus = "ready" | "offline" | "error";

export interface PrintProvider {
  print(receiptPayload: ReceiptPayload): Promise<void>;
  testPrint(): Promise<void>;
  checkStatus(): Promise<PrinterStatus>;
}
