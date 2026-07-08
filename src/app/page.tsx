export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 text-4xl">
        🍽
      </div>
      <h1 className="text-3xl font-extrabold text-stone-900">نظام طلبات المطعم</h1>
      <p className="mt-3 max-w-md leading-relaxed text-stone-600">
        امسح رمز QR على طاولتك للطلب مباشرة، أو اطلب توصيل أو استلام من المطعم.
      </p>
      <a
        href="/order"
        className="mt-8 w-full max-w-xs rounded-2xl bg-amber-600 px-6 py-3.5 font-bold text-white transition hover:bg-amber-700"
      >
        طلب توصيل أو استلام
      </a>
      <a
        href="/login"
        className="mt-5 text-sm font-medium text-stone-500 hover:text-stone-800"
      >
        دخول الموظفين
      </a>
    </main>
  );
}
