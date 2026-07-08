import { z } from "zod";

const toggleFormSchema = z.object({
  id: z.string().uuid(),
  next: z.boolean(),
});

export type ToggleFormValues = z.infer<typeof toggleFormSchema>;

/**
 * Parse the hidden inputs submitted by ToggleActiveButton's <form>.
 * Returns null for malformed input so server actions can no-op safely
 * instead of throwing during an RSC form submission.
 */
export function parseToggleForm(formData: FormData): ToggleFormValues | null {
  const idRaw = formData.get("id");
  const nextRaw = formData.get("next");

  const parsed = toggleFormSchema.safeParse({
    id: typeof idRaw === "string" ? idRaw : "",
    next: nextRaw === "true",
  });

  return parsed.success ? parsed.data : null;
}
