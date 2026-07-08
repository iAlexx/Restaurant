export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-stone-200" />
          <div className="h-4 w-40 animate-pulse rounded bg-stone-200" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex gap-3 rounded-2xl border border-stone-200 bg-white p-3"
            >
              <div className="h-24 w-24 shrink-0 animate-pulse rounded-xl bg-stone-200" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-2/3 animate-pulse rounded bg-stone-200" />
                <div className="h-3 w-full animate-pulse rounded bg-stone-100" />
                <div className="h-4 w-20 animate-pulse rounded bg-stone-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
