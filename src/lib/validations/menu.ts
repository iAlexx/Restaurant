import { z } from "zod";

export const categorySchema = z.object({
  name_ar: z.string().min(1, "اسم القسم مطلوب").max(100),
  image_url: z
    .union([z.string().url(), z.literal("")])
    .optional()
    .transform((value) => (value ? value : null)),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_active: z.coerce.boolean().default(true),
});

export const addOnSchema = z.object({
  name_ar: z.string().min(1, "اسم الإضافة مطلوب").max(100),
  extra_price: z.coerce.number().int().min(0, "السعر يجب أن يكون عدداً صحيحاً"),
  is_available: z.coerce.boolean().default(true),
});

export const productSchema = z.object({
  category_id: z.string().uuid("اختر قسماً صالحاً"),
  name_ar: z.string().min(1, "اسم المنتج مطلوب").max(150),
  description_ar: z.string().max(500).optional().nullable(),
  price: z.coerce.number().int().min(0, "السعر يجب أن يكون عدداً صحيحاً"),
  is_available: z.coerce.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).default(0),
  add_on_ids: z.array(z.string().uuid()).default([]),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type AddOnInput = z.infer<typeof addOnSchema>;
export type ProductInput = z.infer<typeof productSchema>;
