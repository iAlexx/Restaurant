import type { PublicRestaurantSettings } from "@/lib/menu/public-menu";

/** Bundled fallback when admin has not uploaded a hero image. */
export const BUNDLED_DINE_IN_COVER_PATH = "/images/dine-in-cover.webp";

export function resolveDineInHeroSrc(
  settings: Pick<PublicRestaurantSettings, "hero_image_url">
): string {
  const custom = settings.hero_image_url?.trim();
  return custom || BUNDLED_DINE_IN_COVER_PATH;
}

export function resolveDineInWelcomeMessage(
  settings: Pick<PublicRestaurantSettings, "name" | "welcome_message">
): string {
  const custom = settings.welcome_message?.trim();
  if (custom) return custom;
  return `مرحباً بكم في ${settings.name}\nاطلب من طاولتك بكل سهولة`;
}

export function isRemoteHeroImage(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}
