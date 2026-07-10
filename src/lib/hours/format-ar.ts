import { parseTimeToMinutes } from "@/lib/hours/damascus-time";

export function formatArabicTime(time24: string): string {
  const minutes = parseTimeToMinutes(time24);
  if (minutes === null) return time24;

  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour24 >= 12 ? "م" : "ص";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;

  const minutePart = minute === 0 ? "" : `:${String(minute).padStart(2, "0")}`;
  return `${hour12}${minutePart} ${period}`;
}

export function formatMinutesAsArabicTime(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;
  return formatArabicTime(
    `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
  );
}

export function formatClosingSoonMinutes(minutes: number): string {
  if (minutes <= 1) return "دقيقة واحدة";
  if (minutes === 2) return "دقيقتين";
  if (minutes <= 10) return `${minutes} دقائق`;
  return `${minutes} دقيقة`;
}
