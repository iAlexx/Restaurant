"use client";

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
}: QuantityStepperProps) {
  const btn =
    size === "md"
      ? "h-11 w-11 text-xl"
      : "h-9 w-9 text-lg";
  const num = size === "md" ? "w-10 text-lg" : "w-8 text-base";

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 p-1">
      <button
        type="button"
        aria-label="إنقاص الكمية"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`${btn} flex items-center justify-center rounded-full bg-white font-bold text-stone-700 shadow-sm transition hover:text-amber-700 disabled:opacity-40`}
      >
        −
      </button>
      <span className={`${num} text-center font-bold tabular-nums text-stone-900`}>
        {value}
      </span>
      <button
        type="button"
        aria-label="زيادة الكمية"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={`${btn} flex items-center justify-center rounded-full bg-white font-bold text-stone-700 shadow-sm transition hover:text-amber-700 disabled:opacity-40`}
      >
        +
      </button>
    </div>
  );
}
