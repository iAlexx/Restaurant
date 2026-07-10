import {
  DAY_KEYS,
  DEFAULT_WEEKLY_OPENING_HOURS,
  type DayKey,
  type TimeSlot,
  type WeeklyOpeningHours,
} from "@/lib/hours/types";

function isValidTime(value: unknown): value is string {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
}

function normalizeSlot(raw: unknown): TimeSlot | null {
  if (!raw || typeof raw !== "object") return null;
  const slot = raw as { open?: unknown; close?: unknown };
  if (!isValidTime(slot.open) || !isValidTime(slot.close)) return null;
  return { open: slot.open, close: slot.close };
}

export function normalizeWeeklyOpeningHours(raw: unknown): WeeklyOpeningHours {
  const base = { ...DEFAULT_WEEKLY_OPENING_HOURS };
  if (!raw || typeof raw !== "object") return base;

  const record = raw as Record<string, unknown>;
  const result = { ...base };

  for (const day of DAY_KEYS) {
    const dayValue = record[day];
    if (!Array.isArray(dayValue)) {
      result[day] = [];
      continue;
    }
    result[day] = dayValue
      .map(normalizeSlot)
      .filter((slot): slot is TimeSlot => slot !== null);
  }

  return result;
}

export function dayKeyFromJsDay(jsDay: number): DayKey {
  const map: Record<number, DayKey> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
  };
  return map[jsDay] ?? "sunday";
}

export function previousDayKey(day: DayKey): DayKey {
  const index = DAY_KEYS.indexOf(day);
  return DAY_KEYS[(index - 1 + DAY_KEYS.length) % DAY_KEYS.length];
}

export function nextDayKey(day: DayKey): DayKey {
  const index = DAY_KEYS.indexOf(day);
  return DAY_KEYS[(index + 1) % DAY_KEYS.length];
}

export function weeklyHoursFromForm(formData: FormData): WeeklyOpeningHours {
  const result = {} as WeeklyOpeningHours;

  for (const day of DAY_KEYS) {
    const enabled =
      formData.get(`hours_${day}_enabled`) === "on" ||
      formData.get(`hours_${day}_enabled`) === "true";
    if (!enabled) {
      result[day] = [];
      continue;
    }

    const open = String(formData.get(`hours_${day}_open`) ?? "").trim();
    const close = String(formData.get(`hours_${day}_close`) ?? "").trim();
    if (open && close) {
      result[day] = [{ open, close }];
    } else {
      result[day] = [];
    }
  }

  return result;
}
