import { z } from "zod";
import type { CreateOrderInput } from "@/lib/validations/order";
import type { ResolvedLineSnapshot } from "@/lib/orders/calculations";

const trustedChargeSchema = z.object({
  charge_id: z.string().uuid().nullable(),
  name_snapshot: z.string().min(1),
  calculation_type_snapshot: z.enum(["PERCENTAGE", "FIXED"]),
  value_snapshot: z.number().int().min(0),
  calculated_amount: z.number().int().min(0),
  sort_order_snapshot: z.number().int().min(0),
});

const trustedAddOnSchema = z.object({
  add_on_id: z.string().uuid(),
  name_snapshot: z.string().min(1),
  price_snapshot: z.number().int().min(0),
});

const trustedItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name_snapshot: z.string().min(1),
  unit_price_snapshot: z.number().int().min(0),
  quantity: z.number().int().min(1).max(99),
  line_total: z.number().int().min(0),
  notes: z.string().max(200).nullable(),
  add_ons: z.array(trustedAddOnSchema),
});

export const trustedOrderPayloadSchema = z.object({
  submit_token: z.string().uuid(),
  order_type: z.enum(["DINE_IN", "DELIVERY", "PICKUP"]),
  status: z.enum([
    "NEW",
    "WAITING_WHATSAPP_CONFIRMATION",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "COMPLETED",
    "CANCELLED",
  ]),
  table_id: z.string().uuid().nullable(),
  table_label_snapshot: z.string().nullable(),
  customer_name: z.string().nullable(),
  customer_phone: z.string().nullable(),
  customer_address: z.string().nullable(),
  location_url: z.string().nullable(),
  pickup_time: z.string().nullable(),
  notes: z.string().nullable(),
  subtotal: z.number().int().min(0),
  delivery_fee: z.number().int().min(0),
  total: z.number().int().min(0),
  created_by: z.string().uuid().nullable().optional(),
  items: z.array(trustedItemSchema).min(1),
  charges: z.array(trustedChargeSchema).default([]),
});

export type TrustedOrderPayload = z.infer<typeof trustedOrderPayloadSchema>;

export const createOrderRpcResultSchema = z.object({
  id: z.string().uuid(),
  order_number: z.string().min(1),
  order_type: z.enum(["DINE_IN", "DELIVERY", "PICKUP"]),
  status: z.string(),
  subtotal: z.number().int(),
  delivery_fee: z.number().int(),
  total: z.number().int(),
  existing: z.boolean(),
});

export type CreateOrderRpcResult = z.infer<typeof createOrderRpcResultSchema>;

export function buildTrustedOrderPayload(params: {
  submit_token: string;
  order_type: CreateOrderInput["order_type"];
  status: TrustedOrderPayload["status"];
  tableId: string | null;
  tableLabelSnapshot: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  locationUrl?: string | null;
  pickupTime?: string | null;
  notes?: string | null;
  lines: ResolvedLineSnapshot[];
  subtotal: number;
  deliveryFee: number;
  charges?: import("@/lib/charges/types").ResolvedChargeSnapshot[];
  total: number;
  createdBy?: string | null;
}): TrustedOrderPayload {
  const {
    submit_token,
    order_type,
    status,
    tableId,
    tableLabelSnapshot,
    customerName = null,
    customerPhone = null,
    customerAddress = null,
    locationUrl = null,
    pickupTime = null,
    notes = null,
    lines,
    subtotal,
    deliveryFee,
    charges = [],
    total,
    createdBy = null,
  } = params;

  const payload: TrustedOrderPayload = {
    submit_token,
    order_type,
    status,
    table_id: tableId,
    table_label_snapshot: tableLabelSnapshot,
    customer_name: order_type !== "DINE_IN" ? customerName : null,
    customer_phone: order_type !== "DINE_IN" ? customerPhone : null,
    customer_address: order_type === "DELIVERY" ? customerAddress : null,
    location_url: order_type === "DELIVERY" ? locationUrl : null,
    pickup_time: order_type === "PICKUP" ? pickupTime : null,
    notes,
    subtotal,
    delivery_fee: deliveryFee,
    total,
    created_by: createdBy,
    charges: charges.map((charge) => ({
      charge_id: charge.charge_id,
      name_snapshot: charge.name_snapshot,
      calculation_type_snapshot: charge.calculation_type_snapshot,
      value_snapshot: charge.value_snapshot,
      calculated_amount: charge.calculated_amount,
      sort_order_snapshot: charge.sort_order_snapshot,
    })),
    items: lines.map((line) => ({
      product_id: line.product_id,
      product_name_snapshot: line.product_name_snapshot,
      unit_price_snapshot: line.unit_price_snapshot,
      quantity: line.quantity,
      line_total: line.line_total,
      notes: line.notes,
      add_ons: line.add_ons.map((a) => ({
        add_on_id: a.add_on_id,
        name_snapshot: a.name_snapshot,
        price_snapshot: a.price_snapshot,
      })),
    })),
  };

  return trustedOrderPayloadSchema.parse(payload);
}

/** @deprecated Use buildTrustedOrderPayload with explicit fields */
export function buildTrustedOrderPayloadFromCustomerInput(params: {
  input: CreateOrderInput;
  status: TrustedOrderPayload["status"];
  tableId: string | null;
  tableLabelSnapshot: string | null;
  lines: ResolvedLineSnapshot[];
  subtotal: number;
  deliveryFee: number;
  charges?: import("@/lib/charges/types").ResolvedChargeSnapshot[];
  total: number;
}): TrustedOrderPayload {
  const { input, status, tableId, tableLabelSnapshot, lines, subtotal, deliveryFee, charges = [], total } =
    params;

  return buildTrustedOrderPayload({
    submit_token: input.submit_token,
    order_type: input.order_type,
    status,
    tableId,
    tableLabelSnapshot,
    customerName: input.order_type !== "DINE_IN" ? input.customer_name : null,
    customerPhone: input.order_type !== "DINE_IN" ? input.customer_phone : null,
    customerAddress:
      input.order_type === "DELIVERY" ? input.customer_address : null,
    locationUrl:
      input.order_type === "DELIVERY" ? input.location_url ?? null : null,
    pickupTime: input.order_type === "PICKUP" ? input.pickup_time ?? null : null,
    notes: input.notes ?? null,
    lines,
    subtotal,
    deliveryFee,
    charges,
    total,
  });
}

export function parseCreateOrderRpcResult(data: unknown): CreateOrderRpcResult {
  return createOrderRpcResultSchema.parse(data);
}
