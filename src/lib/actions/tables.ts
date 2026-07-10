"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { generateSecureToken } from "@/lib/tokens";
import { tableSchema } from "@/lib/validations/tables";
import type { Table } from "@/types/database";
import type { ActionResult } from "@/lib/actions/types";
import { parseToggleForm } from "@/lib/actions/toggle-form";
import {
  buildTableDeletePreview,
  type DeletePreview,
} from "@/lib/admin/delete-policy";
import { parseEntityId } from "@/lib/admin/delete-id";

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

export async function getTableById(id: string): Promise<Table | null> {
  await requireAdminSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return null;
  return (data as Table) ?? null;
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

export async function toggleTableActiveForm(formData: FormData): Promise<void> {
  const values = parseToggleForm(formData);
  if (!values) return;
  await toggleTableActive(values.id, values.next);
}

export async function getTableDeletePreview(id: string): Promise<DeletePreview> {
  await requireAdminSession();
  const entityId = parseEntityId(id);
  if (!entityId) {
    return {
      canDelete: false,
      entityName: "",
      blockReason: "معرّف الطاولة غير صالح",
      dependencyLines: [],
      requireTypedConfirmation: false,
    };
  }

  const supabase = await createClient();
  const { data: table, error } = await supabase
    .from("tables")
    .select("label")
    .eq("id", entityId)
    .maybeSingle();

  if (error || !table) {
    return {
      canDelete: false,
      entityName: "",
      blockReason: "الطاولة غير موجودة",
      dependencyLines: [],
      requireTypedConfirmation: false,
    };
  }

  const { count, error: countError } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("table_id", entityId);

  if (countError) {
    return {
      canDelete: false,
      entityName: (table as { label: string }).label,
      blockReason: "تعذر التحقق من الطلبات المرتبطة",
      dependencyLines: [],
      requireTypedConfirmation: false,
    };
  }

  return buildTableDeletePreview(
    (table as { label: string }).label,
    count ?? 0
  );
}

export async function deleteTable(id: string): Promise<ActionResult> {
  await requireAdminSession();
  const entityId = parseEntityId(id);
  if (!entityId) return { error: "معرّف الطاولة غير صالح" };

  const preview = await getTableDeletePreview(entityId);
  if (!preview.canDelete) {
    return { error: preview.blockReason ?? "لا يمكن حذف هذه الطاولة" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tables").delete().eq("id", entityId);

  if (error) return { error: "تعذر حذف الطاولة" };

  revalidatePath("/dashboard/tables");
  return { success: "تم حذف الطاولة" };
}
