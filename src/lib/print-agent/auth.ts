import { hashToken } from "@/lib/tokens";
import { createServiceClient } from "@/lib/supabase/service";
import type { AuthenticatedPrintDevice } from "@/lib/print-agent/types";

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function authenticatePrintDevice(
  request: Request
): Promise<AuthenticatedPrintDevice | null> {
  const token = extractBearerToken(request);
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("print_devices")
    .select("id, name, is_active")
    .eq("token_hash", tokenHash)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as AuthenticatedPrintDevice;
}
