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
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-stone-900">لوحة المطعم</h1>
          <p className="mt-2 text-sm text-stone-600">سجّل الدخول لإدارة الطلبات</p>
        </div>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
