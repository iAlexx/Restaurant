export const RESTAURANT_TIMEZONE = "Asia/Damascus";

export const DAY_KEYS = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;

export type DayKey = (typeof DAY_KEYS)[number];

export interface TimeSlot {
  open: string;
  close: string;
}

export type WeeklyOpeningHours = Record<DayKey, TimeSlot[]>;

export type ManualHoursOverride = "open" | "closed";

export interface OpeningHoursSettings {
  weekly_opening_hours: WeeklyOpeningHours;
  is_temporarily_closed: boolean;
  temporary_closure_message: string | null;
  manual_hours_override: ManualHoursOverride | null;
  manual_hours_override_until: string | null;
}

export type RestaurantOpenState = "open" | "closing_soon" | "closed";

export interface RestaurantOpenStatus {
  state: RestaurantOpenState;
  isOpen: boolean;
  isAcceptingCustomerOrders: boolean;
  badgeLabel: string;
  closesAtLabel: string | null;
  closingSoonMinutes: number | null;
  closedTitle: string | null;
  nextOpeningLabel: string | null;
  closureMessage: string | null;
}

export const DAY_LABELS_AR: Record<DayKey, string> = {
  saturday: "السبت",
  sunday: "الأحد",
  monday: "الاثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
};

/** JS Date.getDay(): 0 = Sunday … 6 = Saturday */
export const JS_DAY_TO_KEY: Record<number, DayKey> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

export const DEFAULT_WEEKLY_OPENING_HOURS: WeeklyOpeningHours = {
  saturday: [{ open: "10:00", close: "23:00" }],
  sunday: [{ open: "10:00", close: "23:00" }],
  monday: [{ open: "10:00", close: "23:00" }],
  tuesday: [{ open: "10:00", close: "23:00" }],
  wednesday: [{ open: "10:00", close: "23:00" }],
  thursday: [{ open: "10:00", close: "23:00" }],
  friday: [],
};
