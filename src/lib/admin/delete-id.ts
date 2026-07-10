import { z } from "zod";

const entityIdSchema = z.string().uuid("معرّف غير صالح");

export function parseEntityId(id: string): string | null {
  const parsed = entityIdSchema.safeParse(id);
  return parsed.success ? parsed.data : null;
}
