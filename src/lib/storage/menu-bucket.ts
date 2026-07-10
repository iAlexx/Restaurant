import { createServiceClient } from "@/lib/supabase/service";

export const MENU_BUCKET_ID = "menu";

const MENU_PUBLIC_PATH = `/storage/v1/object/public/${MENU_BUCKET_ID}/`;

export function extractMenuStoragePath(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const idx = url.pathname.indexOf(MENU_PUBLIC_PATH);
    if (idx === -1) return null;
    const path = decodeURIComponent(
      url.pathname.slice(idx + MENU_PUBLIC_PATH.length)
    );
    if (!path || path.includes("..")) return null;
    return path;
  } catch {
    return null;
  }
}

export function isMenuBucketPublicUrl(publicUrl: string | null | undefined): boolean {
  if (!publicUrl) return false;
  return extractMenuStoragePath(publicUrl) !== null;
}

export async function safeDeleteReplacedMenuImage(
  oldUrl: string | null | undefined,
  newUrl: string | null | undefined,
  options?: { excludeProductId?: string }
): Promise<void> {
  if (!oldUrl || oldUrl === newUrl) return;

  const storagePath = extractMenuStoragePath(oldUrl);
  if (!storagePath) return;

  const supabase = createServiceClient();

  let productQuery = supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("image_url", oldUrl);

  if (options?.excludeProductId) {
    productQuery = productQuery.neq("id", options.excludeProductId);
  }

  const { count: productRefs, error: productError } = await productQuery;
  if (productError || (productRefs ?? 0) > 0) return;

  const { count: categoryRefs, error: categoryError } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("image_url", oldUrl);

  if (categoryError || (categoryRefs ?? 0) > 0) return;

  const { data: settings, error: settingsError } = await supabase
    .from("restaurant_settings")
    .select("logo_url, hero_image_url")
    .eq("id", 1)
    .single();

  if (settingsError) return;
  const row = settings as { logo_url: string | null; hero_image_url: string | null } | null;
  if (row?.logo_url === oldUrl || row?.hero_image_url === oldUrl) {
    return;
  }

  await supabase.storage.from(MENU_BUCKET_ID).remove([storagePath]);
}
