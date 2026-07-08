export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">نظام طلبات المطعم</h1>
      <p className="mt-2 max-w-md text-stone-600">
        امسح رمز QR على طاولتك للطلب، أو استخدم رابط التوصيل والاستلام من المطعم.
      </p>
      <a
        href="/order"
        className="mt-6 rounded-xl bg-amber-600 px-6 py-3 font-medium text-white"
      >
        طلب توصيل أو استلام
      </a>
      <a
        href="/login"
        className="mt-4 text-sm text-amber-700 underline"
      >
        دخول الموظفين
      </a>
    </main>
  );
}
