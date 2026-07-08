import { z } from "zod";

export const tableSchema = z.object({
  label: z.string().min(1, "رقم أو اسم الطاولة مطلوب").max(50),
  is_active: z.coerce.boolean().default(true),
});

export type TableInput = z.infer<typeof tableSchema>;
