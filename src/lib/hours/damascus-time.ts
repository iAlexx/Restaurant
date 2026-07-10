import { RESTAURANT_TIMEZONE } from "@/lib/hours/types";

export interface DamascusDateTime {
  year: number;
  month: number;
  day: number;
  /** 0 = Sunday … 6 = Saturday (matches JS getDay) */
  dayOfWeek: number;
  hour: number;
  minute: number;
  /** Minutes since midnight in Damascus */
  totalMinutes: number;
}

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function parsePart(parts: Intl.DateTimeFormatPart[], type: string): string {
  return parts.find((p) => p.type === type)?.value ?? "0";
}

export function getDamascusDateTime(at: Date = new Date()): DamascusDateTime {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: RESTAURANT_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(at);
  const hourRaw = parseInt(parsePart(parts, "hour"), 10);
  const hour = hourRaw === 24 ? 0 : hourRaw;
  const minute = parseInt(parsePart(parts, "minute"), 10);
  const weekdayShort = parsePart(parts, "weekday");

  return {
    year: parseInt(parsePart(parts, "year"), 10),
    month: parseInt(parsePart(parts, "month"), 10),
    day: parseInt(parsePart(parts, "day"), 10),
    dayOfWeek: WEEKDAY_MAP[weekdayShort] ?? 0,
    hour,
    minute,
    totalMinutes: hour * 60 + minute,
  };
}

/** Advance a Damascus calendar date by N days (ignores DST edge cases via UTC noon trick). */
export function addDamascusDays(
  dt: Pick<DamascusDateTime, "year" | "month" | "day">,
  days: number
): Pick<DamascusDateTime, "year" | "month" | "day"> {
  const utc = new Date(Date.UTC(dt.year, dt.month - 1, dt.day + days, 12, 0, 0));
  const shifted = getDamascusDateTime(utc);
  return { year: shifted.year, month: shifted.month, day: shifted.day };
}

export function jsDayFromDamascusDate(
  date: Pick<DamascusDateTime, "year" | "month" | "day">
): number {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day, 12, 0, 0));
  return getDamascusDateTime(utc).dayOfWeek;
}

export function parseTimeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

export function isOvernightSlot(openMin: number, closeMin: number): boolean {
  return closeMin <= openMin;
}
