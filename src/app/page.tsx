import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonPrimaryClassName, buttonSecondaryClassName } from "@/components/dashboard/form-ui";
import { RestaurantSplashGate } from "@/components/customer/restaurant-splash-gate";
import { RestaurantLogo } from "@/components/customer/restaurant-logo";
import { RestaurantOpenStatus } from "@/components/customer/restaurant-open-status";
import { fetchPublicOpenStatus } from "@/lib/menu/public-menu";

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: settings }, openStatus] = await Promise.all([
    supabase.from("restaurant_settings_public").select("logo_url").single(),
    fetchPublicOpenStatus(),
  ]);

  const logoUrl = (settings as { logo_url: string | null } | null)?.logo_url;

  return (
    <RestaurantSplashGate logoUrl={logoUrl}>
      <main className="flex min-h-screen flex-col items-center justify-center bg-brand-cream px-4 py-10 text-center">
        <div className="motion-fade-up w-full max-w-md">
          <RestaurantLogo logoUrl={logoUrl} variant="landing" />

          <div className="motion-fade-up motion-stagger-1 mt-4 flex justify-center">
            <RestaurantOpenStatus status={openStatus} variant="compact" />
          </div>

          <p className="motion-fade-up motion-stagger-1 mt-4 max-w-sm leading-relaxed text-brand-muted">
            مرحباً بك — اطلب من طاولتك أو استمتع بتوصيل واستلام سريع.
          </p>

          <div className="motion-fade-up motion-stagger-2 mt-8 space-y-3">
            <Link href="/dine-in" className={`${buttonPrimaryClassName()} w-full rounded-2xl py-3.5 text-base`}>
              طلب داخل المطعم
            </Link>
            <Link
              href="/order"
              className={`${buttonSecondaryClassName()} w-full rounded-2xl border-brand-gold/50 py-3.5 text-base`}
            >
              طلب توصيل أو استلام
            </Link>
          </div>

          <Link
            href="/login"
            className="motion-fade-up motion-stagger-3 mt-6 inline-block text-sm font-medium text-brand-muted hover:text-brand-chocolate"
          >
            دخول الموظفين
          </Link>
        </div>
      </main>
    </RestaurantSplashGate>
  );
}
