import {
  addDamascusDays,
  getDamascusDateTime,
  isOvernightSlot,
  jsDayFromDamascusDate,
  parseTimeToMinutes,
  type DamascusDateTime,
} from "@/lib/hours/damascus-time";
import {
  formatArabicTime,
  formatMinutesAsArabicTime,
} from "@/lib/hours/format-ar";
import {
  dayKeyFromJsDay,
  nextDayKey,
  normalizeWeeklyOpeningHours,
  previousDayKey,
} from "@/lib/hours/schedule";
import {
  DEFAULT_WEEKLY_OPENING_HOURS,
  type DayKey,
  type OpeningHoursSettings,
  type RestaurantOpenStatus,
  type TimeSlot,
  type WeeklyOpeningHours,
} from "@/lib/hours/types";

const CLOSING_SOON_MINUTES = 30;

export const CUSTOMER_ORDER_CLOSED_MESSAGE =
  "المطعم مغلق حالياً ولا يمكن إرسال الطلب";

interface ActiveSlot {
  openMin: number;
  closeMin: number;
  closeTime24: string;
  isOvernight: boolean;
  inMorningTail: boolean;
}

function resolveManualOverride(
  settings: OpeningHoursSettings,
  at: Date
): "open" | "closed" | null {
  if (!settings.manual_hours_override) return null;
  if (settings.manual_hours_override_until) {
    const until = new Date(settings.manual_hours_override_until);
    if (at.getTime() >= until.getTime()) return null;
  }
  return settings.manual_hours_override;
}

function getSlotsForDay(
  schedule: WeeklyOpeningHours,
  dayKey: DayKey
): TimeSlot[] {
  return schedule[dayKey] ?? [];
}

function findActiveSlot(
  schedule: WeeklyOpeningHours,
  dt: DamascusDateTime
): ActiveSlot | null {
  const dayKey = dayKeyFromJsDay(dt.dayOfWeek);
  const todaySlots = getSlotsForDay(schedule, dayKey);

  for (const slot of todaySlots) {
    const openMin = parseTimeToMinutes(slot.open);
    const closeMin = parseTimeToMinutes(slot.close);
    if (openMin === null || closeMin === null) continue;

    if (!isOvernightSlot(openMin, closeMin)) {
      if (dt.totalMinutes >= openMin && dt.totalMinutes < closeMin) {
        return {
          openMin,
          closeMin,
          closeTime24: slot.close,
          isOvernight: false,
          inMorningTail: false,
        };
      }
      continue;
    }

    if (dt.totalMinutes >= openMin) {
      return {
        openMin,
        closeMin,
        closeTime24: slot.close,
        isOvernight: true,
        inMorningTail: false,
      };
    }
  }

  const prevDayKey = previousDayKey(dayKey);
  const prevSlots = getSlotsForDay(schedule, prevDayKey);

  for (const slot of prevSlots) {
    const openMin = parseTimeToMinutes(slot.open);
    const closeMin = parseTimeToMinutes(slot.close);
    if (openMin === null || closeMin === null) continue;
    if (!isOvernightSlot(openMin, closeMin)) continue;
    if (dt.totalMinutes < closeMin) {
      return {
        openMin,
        closeMin,
        closeTime24: slot.close,
        isOvernight: true,
        inMorningTail: true,
      };
    }
  }

  return null;
}

function minutesUntilClose(dt: DamascusDateTime, active: ActiveSlot): number {
  if (!active.isOvernight) {
    return active.closeMin - dt.totalMinutes;
  }
  if (active.inMorningTail) {
    return active.closeMin - dt.totalMinutes;
  }
  return 1440 - dt.totalMinutes + active.closeMin;
}

interface NextOpening {
  isToday: boolean;
  isTomorrow: boolean;
  openTime24: string;
}

function findNextOpening(
  schedule: WeeklyOpeningHours,
  dt: DamascusDateTime
): NextOpening | null {
  for (let offset = 0; offset < 8; offset++) {
    const date =
      offset === 0
        ? { year: dt.year, month: dt.month, day: dt.day }
        : addDamascusDays({ year: dt.year, month: dt.month, day: dt.day }, offset);

    const jsDay = jsDayFromDamascusDate(date);
    const dayKey = dayKeyFromJsDay(jsDay);
    const slots = getSlotsForDay(schedule, dayKey);

    for (const slot of slots) {
      const openMin = parseTimeToMinutes(slot.open);
      if (openMin === null) continue;

      if (offset === 0 && dt.totalMinutes >= openMin) {
        continue;
      }

      return {
        isToday: offset === 0,
        isTomorrow: offset === 1,
        openTime24: slot.open,
      };
    }
  }

  return null;
}

function buildNextOpeningLabel(next: NextOpening | null): string | null {
  if (!next) return null;
  const timeLabel = formatArabicTime(next.openTime24);
  if (next.isToday) return `يفتح اليوم الساعة ${timeLabel}`;
  if (next.isTomorrow) return `يفتح غداً الساعة ${timeLabel}`;
  return `يفتح الساعة ${timeLabel}`;
}

function buildClosedStatus(
  settings: OpeningHoursSettings,
  nextOpeningLabel: string | null
): RestaurantOpenStatus {
  const message =
    settings.is_temporarily_closed && settings.temporary_closure_message
      ? settings.temporary_closure_message
      : settings.temporary_closure_message;

  return {
    state: "closed",
    isOpen: false,
    isAcceptingCustomerOrders: false,
    badgeLabel: "مغلق",
    closesAtLabel: null,
    closingSoonMinutes: null,
    closedTitle: "المطعم مغلق حالياً",
    nextOpeningLabel,
    closureMessage: message,
  };
}

export function computeRestaurantOpenStatus(
  rawSettings: Partial<OpeningHoursSettings> | null | undefined,
  at: Date = new Date()
): RestaurantOpenStatus {
  const settings: OpeningHoursSettings = {
    weekly_opening_hours: normalizeWeeklyOpeningHours(
      rawSettings?.weekly_opening_hours ?? DEFAULT_WEEKLY_OPENING_HOURS
    ),
    is_temporarily_closed: rawSettings?.is_temporarily_closed ?? false,
    temporary_closure_message: rawSettings?.temporary_closure_message ?? null,
    manual_hours_override: rawSettings?.manual_hours_override ?? null,
    manual_hours_override_until: rawSettings?.manual_hours_override_until ?? null,
  };

  const dt = getDamascusDateTime(at);
  const nextOpening = findNextOpening(settings.weekly_opening_hours, dt);
  const nextOpeningLabel = buildNextOpeningLabel(nextOpening);

  const manual = resolveManualOverride(settings, at);
  if (manual === "closed") {
    return buildClosedStatus(settings, nextOpeningLabel);
  }

  if (settings.is_temporarily_closed && manual !== "open") {
    return buildClosedStatus(settings, nextOpeningLabel);
  }

  const active = findActiveSlot(settings.weekly_opening_hours, dt);

  if (manual === "open" && !active) {
    return {
      state: "open",
      isOpen: true,
      isAcceptingCustomerOrders: true,
      badgeLabel: "مفتوح الآن",
      closesAtLabel: null,
      closingSoonMinutes: null,
      closedTitle: null,
      nextOpeningLabel: null,
      closureMessage: null,
    };
  }

  if (!active) {
    return buildClosedStatus(settings, nextOpeningLabel);
  }

  const minutesLeft = minutesUntilClose(dt, active);
  const closesAtLabel = `يغلق الساعة ${formatMinutesAsArabicTime(active.closeMin)}`;

  if (minutesLeft <= CLOSING_SOON_MINUTES) {
    return {
      state: "closing_soon",
      isOpen: true,
      isAcceptingCustomerOrders: true,
      badgeLabel: "سيغلق المطعم قريباً",
      closesAtLabel,
      closingSoonMinutes: minutesLeft,
      closedTitle: null,
      nextOpeningLabel: null,
      closureMessage: null,
    };
  }

  return {
    state: "open",
    isOpen: true,
    isAcceptingCustomerOrders: true,
    badgeLabel: "مفتوح الآن",
    closesAtLabel,
    closingSoonMinutes: null,
    closedTitle: null,
    nextOpeningLabel: null,
    closureMessage: null,
  };
}

export function isRestaurantOpenForOrders(
  rawSettings: Partial<OpeningHoursSettings> | null | undefined,
  at: Date = new Date()
): boolean {
  return computeRestaurantOpenStatus(rawSettings, at).isAcceptingCustomerOrders;
}

/** @internal exported for tests */
export function __testing__findActiveSlot(
  schedule: WeeklyOpeningHours,
  dt: DamascusDateTime
) {
  return findActiveSlot(schedule, dt);
}

export function __testing__findNextOpening(
  schedule: WeeklyOpeningHours,
  dt: DamascusDateTime
) {
  return findNextOpening(schedule, dt);
}

export function __testing__nextDayKey(day: DayKey) {
  return nextDayKey(day);
}
