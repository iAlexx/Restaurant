import { z } from "zod";

export const restaurantSettingsSchema = z.object({
  name: z.string().min(1, "اسم المطعم مطلوب").max(150),
  phone: z.string().max(30).optional().nullable(),
  whatsapp_phone: z.string().max(30).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  currency_label: z.string().min(1, "رمز العملة مطلوب").max(20),
  opening_hours: z.string().max(500).optional().nullable(),
  delivery_enabled: z.coerce.boolean(),
  pickup_enabled: z.coerce.boolean(),
  default_delivery_fee: z.coerce.number().int().min(0),
  min_delivery_order: z.coerce.number().int().min(0),
  receipt_header: z.string().max(300).optional().nullable(),
  receipt_footer: z.string().max(300).optional().nullable(),
});

export const printDeviceSchema = z.object({
  name: z.string().min(1, "اسم الجهاز مطلوب").max(100),
});

export type RestaurantSettingsInput = z.infer<typeof restaurantSettingsSchema>;
export type PrintDeviceInput = z.infer<typeof printDeviceSchema>;
