import { customerContainerClassName } from "@/components/customer/customer-menu-shell";

export default function Loading() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <div className={`${customerContainerClassName} py-6`}>
        <div className="mb-6 h-14 animate-pulse rounded-xl bg-brand-surface shadow-sm" />
        <div className="mb-4 h-10 animate-pulse rounded-xl bg-brand-surface" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-brand-gold/30 bg-brand-surface shadow-sm"
            >
              <div className="aspect-[4/3] animate-pulse bg-brand-gold/20" />
              <div className="space-y-2 p-4">
                <div className="h-5 w-2/3 animate-pulse rounded bg-brand-gold/25" />
                <div className="h-3 w-full animate-pulse rounded bg-brand-cream" />
                <div className="h-6 w-24 animate-pulse rounded bg-brand-gold/25" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
