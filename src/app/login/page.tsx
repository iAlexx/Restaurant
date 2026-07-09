import { LoginForm } from "./login-form";
import { createClient } from "@/lib/supabase/server";

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo =
    params.redirect && params.redirect.startsWith("/dashboard")
      ? params.redirect
      : undefined;

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("restaurant_settings_public")
    .select("name, logo_url")
    .single();

  const name = (settings as { name: string } | null)?.name ?? "مطعمي";
  const logoUrl = (settings as { logo_url: string | null } | null)?.logo_url;

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-cream px-4 py-8">
      <div className="motion-fade-up w-full max-w-md rounded-3xl border border-brand-border bg-brand-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="motion-scale-in mx-auto mb-4 h-14 w-14 rounded-full object-cover ring-2 ring-brand-gold/50"
            />
          ) : (
            <div className="motion-scale-in mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-orange text-2xl text-white">
              🍽
            </div>
          )}
          <h1 className="text-2xl font-extrabold text-brand-chocolate">
            {name}
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            سجّل الدخول لإدارة الطلبات والقائمة
          </p>
        </div>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
