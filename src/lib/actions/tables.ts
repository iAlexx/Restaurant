"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { generateSecureToken } from "@/lib/tokens";
import { tableSchema } from "@/lib/validations/tables";
import type { Table } from "@/types/database";
import type { ActionResult } from "@/lib/actions/types";

export async function listTables(): Promise<Table[]> {
  await requireAdminSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .order("label", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Table[];
}

export async function createTable(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminSession();
  const parsed = tableSchema.safeParse({
    label: formData.get("label"),
    is_active:
      formData.get("is_active") === "on" || formData.get("is_active") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tables").insert({
    ...parsed.data,
    public_token: generateSecureToken(),
  });

  if (error) return { error: "تعذر إنشاء الطاولة" };

  revalidatePath("/dashboard/tables");
  return { success: "تم إنشاء الطاولة" };
}

export async function updateTable(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminSession();
  const parsed = tableSchema.safeParse({
    label: formData.get("label"),
    is_active:
      formData.get("is_active") === "on" || formData.get("is_active") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tables")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: "تعذر تحديث الطاولة" };

  revalidatePath("/dashboard/tables");
  return { success: "تم تحديث الطاولة" };
}

export async function regenerateTableToken(id: string): Promise<ActionResult> {
  await requireAdminSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tables")
    .update({ public_token: generateSecureToken() })
    .eq("id", id);

  if (error) return { error: "تعذر تجديد رمز الطاولة" };

  revalidatePath("/dashboard/tables");
  return { success: "تم تجديد رمز QR — حمّل الرمز الجديد" };
}

export async function toggleTableActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  await requireAdminSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tables")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { error: "تعذر تحديث حالة الطاولة" };

  revalidatePath("/dashboard/tables");
  return { success: isActive ? "تم تفعيل الطاولة" : "تم إيقاف الطاولة" };
}
