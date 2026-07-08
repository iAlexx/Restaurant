export function FormAlert({ message, type }: { message?: string; type: "error" | "success" }) {
  if (!message) return null;

  const styles =
    type === "error"
      ? "bg-red-50 text-red-700"
      : "bg-green-50 text-green-700";

  return (
    <p className={`rounded-lg px-3 py-2 text-sm ${styles}`} role="alert">
      {message}
    </p>
  );
}

export function inputClassName() {
  return "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-200";
}

export function labelClassName() {
  return "mb-1 block text-sm font-medium text-stone-700";
}

export function buttonPrimaryClassName() {
  return "rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60";
}

export function buttonSecondaryClassName() {
  return "rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50";
}
