export default function Loading() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-brand-gold/30" />
          <div className="h-4 w-40 animate-pulse rounded bg-brand-gold/25" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex gap-3 rounded-2xl border border-brand-border bg-brand-surface p-3"
            >
              <div className="h-24 w-24 shrink-0 animate-pulse rounded-xl bg-brand-gold/25" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-2/3 animate-pulse rounded bg-brand-gold/25" />
                <div className="h-3 w-full animate-pulse rounded bg-brand-cream" />
                <div className="h-4 w-20 animate-pulse rounded bg-brand-gold/25" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
