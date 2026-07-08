import { LoginForm } from "./login-form";

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo =
    params.redirect && params.redirect.startsWith("/dashboard")
      ? params.redirect
      : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-600 text-2xl text-white">
            🍽
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900">لوحة المطعم</h1>
          <p className="mt-2 text-sm text-stone-600">
            سجّل الدخول لإدارة الطلبات والقائمة
          </p>
        </div>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
