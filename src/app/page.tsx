import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonPrimaryClassName, buttonSecondaryClassName } from "@/components/dashboard/form-ui";
import { RestaurantSplashGate } from "@/components/customer/restaurant-splash-gate";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("restaurant_settings_public")
    .select("name, logo_url, opening_hours")
    .single();

  const name =
    (settings as { name: string } | null)?.name ?? "مطعمي";
  const logoUrl = (settings as { logo_url: string | null } | null)?.logo_url;
  const openingHours = (settings as { opening_hours: string | null } | null)
    ?.opening_hours;

  return (
    <RestaurantSplashGate logoUrl={logoUrl} restaurantName={name}>
      <main className="flex min-h-screen flex-col items-center justify-center bg-brand-cream px-4 py-10 text-center">
      <div className="motion-fade-up w-full max-w-md">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="motion-scale-in mx-auto mb-5 h-24 w-24 rounded-full object-cover ring-2 ring-brand-gold/60"
          />
        ) : (
          <div className="motion-scale-in mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-brand-orange-soft text-4xl ring-2 ring-brand-gold/50">
            🍽
          </div>
        )}

        <h1 className="motion-fade-up motion-stagger-1 text-3xl font-extrabold text-brand-chocolate">
          {name}
        </h1>
        {openingHours ? (
          <p className="motion-fade-up motion-stagger-2 mt-2 text-sm text-brand-muted">
            {openingHours}
          </p>
        ) : null}
        <p className="motion-fade-up motion-stagger-2 mt-4 max-w-sm leading-relaxed text-brand-muted">
          مرحباً بك — اطلب من طاولتك أو استمتع بتوصيل واستلام سريع.
        </p>

        <div className="motion-fade-up motion-stagger-3 mt-8 space-y-3">
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
          className="motion-fade-up motion-stagger-4 mt-6 inline-block text-sm font-medium text-brand-muted hover:text-brand-chocolate"
        >
          دخول الموظفين
        </Link>
      </div>
    </main>
    </RestaurantSplashGate>
  );
}
