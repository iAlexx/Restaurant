import { z } from "zod";

const appliesToSchema = z.enum(["ALL", "DINE_IN", "DELIVERY", "PICKUP"]);

export const chargeSchema = z
  .object({
    name_ar: z.string().min(1, "اسم الرسم مطلوب").max(100),
    calculation_type: z.enum(["PERCENTAGE", "FIXED"], {
      errorMap: () => ({ message: "نوع الحساب غير صالح" }),
    }),
    percentage_input: z.coerce.number().optional(),
    fixed_amount: z.coerce.number().int().optional(),
    applies_to: appliesToSchema.default("ALL"),
    sort_order: z.coerce.number().int().min(0).default(0),
    is_active: z.coerce.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.calculation_type === "PERCENTAGE") {
      const pct = data.percentage_input;
      if (pct == null || Number.isNaN(pct)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "النسبة المئوية مطلوبة",
          path: ["percentage_input"],
        });
        return;
      }
      if (pct <= 0 || pct > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "النسبة يجب أن تكون بين 0.1% و 100%",
          path: ["percentage_input"],
        });
      }
    }

    if (data.calculation_type === "FIXED") {
      const amount = data.fixed_amount;
      if (amount == null || Number.isNaN(amount)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "المبلغ الثابت مطلوب",
          path: ["fixed_amount"],
        });
        return;
      }
      if (amount < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "المبلغ لا يمكن أن يكون سالباً",
          path: ["fixed_amount"],
        });
      }
    }
  });

export type ChargeInput = z.infer<typeof chargeSchema>;

export function chargeInputToDbValues(input: ChargeInput) {
  const value =
    input.calculation_type === "PERCENTAGE"
      ? Math.round((input.percentage_input ?? 0) * 100)
      : (input.fixed_amount ?? 0);

  return {
    name_ar: input.name_ar,
    calculation_type: input.calculation_type,
    value,
    applies_to: input.applies_to,
    sort_order: input.sort_order,
    is_active: input.is_active,
  };
}

export function dbChargeToFormValues(charge: {
  name_ar: string;
  calculation_type: "PERCENTAGE" | "FIXED";
  value: number;
  applies_to: "ALL" | "DINE_IN" | "DELIVERY" | "PICKUP";
  sort_order: number;
  is_active: boolean;
}) {
  return {
    name_ar: charge.name_ar,
    calculation_type: charge.calculation_type,
    percentage_input:
      charge.calculation_type === "PERCENTAGE" ? charge.value / 100 : undefined,
    fixed_amount:
      charge.calculation_type === "FIXED" ? charge.value : undefined,
    applies_to: charge.applies_to,
    sort_order: charge.sort_order,
    is_active: charge.is_active,
  };
}
