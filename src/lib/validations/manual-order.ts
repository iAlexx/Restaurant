import { z } from "zod";

const manualCartLineSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99),
  add_on_ids: z.array(z.string().uuid()).max(20).default([]),
  notes: z.string().max(200).optional().nullable(),
});

const locationUrlSchema = z
  .string()
  .max(500)
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val) return true;
      try {
        const url = new URL(val);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "رابط الموقع غير صالح" }
  );

const manualBaseSchema = z.object({
  submit_token: z.string().uuid("معرف الإرسال غير صالح"),
  order_type: z.enum(["DINE_IN", "DELIVERY", "PICKUP"]),
  items: z.array(manualCartLineSchema).min(1, "أضف منتجاً واحداً على الأقل").max(50),
  notes: z.string().max(500).optional().nullable(),
});

export const manualDineInOrderSchema = manualBaseSchema.extend({
  order_type: z.literal("DINE_IN"),
  table_id: z.string().uuid("اختر طاولة"),
});

export const manualDeliveryOrderSchema = manualBaseSchema.extend({
  order_type: z.literal("DELIVERY"),
  customer_name: z.string().min(1, "الاسم مطلوب").max(100),
  customer_phone: z.string().min(5, "رقم الهاتف مطلوب").max(20),
  customer_address: z.string().min(3, "العنوان مطلوب").max(300),
  location_url: locationUrlSchema,
  delivery_fee: z.coerce.number().int().min(0).max(1_000_000),
});

export const manualPickupOrderSchema = manualBaseSchema.extend({
  order_type: z.literal("PICKUP"),
  customer_name: z.string().min(1, "الاسم مطلوب").max(100),
  customer_phone: z.string().min(5, "رقم الهاتف مطلوب").max(20),
  pickup_time: z.string().max(100).optional().nullable(),
});

export const manualOrderSchema = z.discriminatedUnion("order_type", [
  manualDineInOrderSchema,
  manualDeliveryOrderSchema,
  manualPickupOrderSchema,
]);

export type ManualOrderInput = z.infer<typeof manualOrderSchema>;
