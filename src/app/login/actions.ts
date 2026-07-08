"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";
import type { Profile } from "@/types/database";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }

  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (signInError) {
    return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "تعذر تسجيل الدخول" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .single();

  const isActive = (profile as Pick<Profile, "is_active"> | null)?.is_active;

  if (!isActive) {
    await supabase.auth.signOut();
    return { error: "هذا الحساب غير مفعّل" };
  }

  const redirectTo = formData.get("redirect");
  if (typeof redirectTo === "string" && redirectTo.startsWith("/dashboard")) {
    redirect(redirectTo);
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
