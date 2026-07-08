import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/roles";
import type { Profile } from "@/types/database";

export { isAdmin } from "@/lib/auth/roles";

export interface StaffSession {
  userId: string;
  email: string;
  profile: Profile;
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, display_name, is_active, created_at")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Profile | null;

  if (error || !typedProfile || !typedProfile.is_active) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    profile: typedProfile,
  };
}

export async function requireStaffSession(): Promise<StaffSession> {
  const session = await getStaffSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function requireAdminSession(): Promise<StaffSession> {
  const session = await requireStaffSession();

  if (!isAdmin(session.profile.role)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}
