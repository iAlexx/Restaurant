import { describe, expect, it } from "vitest";
import { getDamascusDateTime } from "@/lib/hours/damascus-time";
import { formatArabicTime } from "@/lib/hours/format-ar";
import {
  computeRestaurantOpenStatus,
  CUSTOMER_ORDER_CLOSED_MESSAGE,
  isRestaurantOpenForOrders,
  __testing__findActiveSlot,
  __testing__findNextOpening,
} from "@/lib/hours/restaurant-status";
import { DEFAULT_WEEKLY_OPENING_HOURS, type WeeklyOpeningHours } from "@/lib/hours/types";

/** Monday 2026-07-13 in Asia/Damascus unless noted */
const MONDAY_10AM_DAMASCUS = new Date("2026-07-13T07:00:00.000Z");
const MONDAY_8AM_DAMASCUS = new Date("2026-07-13T05:00:00.000Z");
const MONDAY_11PM_DAMASCUS = new Date("2026-07-13T20:00:00.000Z");
const MONDAY_1130PM_DAMASCUS = new Date("2026-07-13T20:30:00.000Z");
const MONDAY_10AM_EXACT_DAMASCUS = new Date("2026-07-13T07:00:00.000Z");
const MONDAY_959AM_DAMASCUS = new Date("2026-07-13T06:59:00.000Z");

const weekdaySchedule: WeeklyOpeningHours = {
  ...DEFAULT_WEEKLY_OPENING_HOURS,
  monday: [{ open: "10:00", close: "23:00" }],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

const overnightFriday: WeeklyOpeningHours = {
  ...DEFAULT_WEEKLY_OPENING_HOURS,
  friday: [{ open: "18:00", close: "02:00" }],
  saturday: [],
  sunday: [],
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
};

describe("getDamascusDateTime", () => {
  it("uses Asia/Damascus timezone", () => {
    const dt = getDamascusDateTime(MONDAY_10AM_DAMASCUS);
    expect(dt.dayOfWeek).toBe(1);
    expect(dt.hour).toBe(10);
    expect(dt.minute).toBe(0);
  });
});

describe("computeRestaurantOpenStatus", () => {
  it("is open during normal hours", () => {
    const status = computeRestaurantOpenStatus(
      { weekly_opening_hours: weekdaySchedule },
      MONDAY_10AM_DAMASCUS
    );
    expect(status.isOpen).toBe(true);
    expect(status.state).toBe("open");
    expect(status.badgeLabel).toBe("مفتوح الآن");
    expect(status.closesAtLabel).toContain("11 م");
  });

  it("is closed before opening", () => {
    const status = computeRestaurantOpenStatus(
      { weekly_opening_hours: weekdaySchedule },
      MONDAY_8AM_DAMASCUS
    );
    expect(status.isOpen).toBe(false);
    expect(status.closedTitle).toBe("المطعم مغلق حالياً");
    expect(status.nextOpeningLabel).toContain("يفتح اليوم");
  });

  it("is closed after closing", () => {
    const status = computeRestaurantOpenStatus(
      { weekly_opening_hours: weekdaySchedule },
      MONDAY_1130PM_DAMASCUS
    );
    expect(status.isOpen).toBe(false);
    expect(status.nextOpeningLabel).toBeTruthy();
  });

  it("handles overnight schedule in the early-morning tail", () => {
    const saturday1am = new Date("2026-07-10T22:00:00.000Z");
    const dt = getDamascusDateTime(saturday1am);
    expect(dt.dayOfWeek).toBe(6);
    expect(dt.hour).toBe(1);

    const active = __testing__findActiveSlot(overnightFriday, dt);
    expect(active).not.toBeNull();
    expect(active?.inMorningTail).toBe(true);

    const status = computeRestaurantOpenStatus(
      { weekly_opening_hours: overnightFriday },
      saturday1am
    );
    expect(status.isOpen).toBe(true);
  });

  it("honours temporarily closed override", () => {
    const status = computeRestaurantOpenStatus(
      {
        weekly_opening_hours: weekdaySchedule,
        is_temporarily_closed: true,
        temporary_closure_message: "المطعم مغلق مؤقتاً وسنعود قريباً",
      },
      MONDAY_10AM_DAMASCUS
    );
    expect(status.isOpen).toBe(false);
    expect(status.closureMessage).toBe("المطعم مغلق مؤقتاً وسنعود قريباً");
  });

  it("calculates next opening time", () => {
    const dt = getDamascusDateTime(MONDAY_8AM_DAMASCUS);
    const next = __testing__findNextOpening(weekdaySchedule, dt);
    expect(next?.isToday).toBe(true);
    expect(next?.openTime24).toBe("10:00");

    const status = computeRestaurantOpenStatus(
      { weekly_opening_hours: weekdaySchedule },
      MONDAY_8AM_DAMASCUS
    );
    expect(status.nextOpeningLabel).toBe(
      `يفتح اليوم الساعة ${formatArabicTime("10:00")}`
    );
  });

  it("treats exact open time as open and exact close time as closed", () => {
    const atOpen = computeRestaurantOpenStatus(
      { weekly_opening_hours: weekdaySchedule },
      MONDAY_10AM_EXACT_DAMASCUS
    );
    expect(atOpen.isOpen).toBe(true);

    const atClose = computeRestaurantOpenStatus(
      { weekly_opening_hours: weekdaySchedule },
      MONDAY_11PM_DAMASCUS
    );
    expect(atClose.isOpen).toBe(false);

    const beforeOpen = computeRestaurantOpenStatus(
      { weekly_opening_hours: weekdaySchedule },
      MONDAY_959AM_DAMASCUS
    );
    expect(beforeOpen.isOpen).toBe(false);
  });

  it("reports closing soon within 30 minutes", () => {
    const monday1035pm = new Date("2026-07-13T19:35:00.000Z");
    const status = computeRestaurantOpenStatus(
      { weekly_opening_hours: weekdaySchedule },
      monday1035pm
    );
    expect(status.state).toBe("closing_soon");
    expect(status.badgeLabel).toBe("سيغلق المطعم قريباً");
    expect(status.closingSoonMinutes).toBe(25);
  });

  it("manual open override forces open while schedule says closed", () => {
    const status = computeRestaurantOpenStatus(
      {
        weekly_opening_hours: weekdaySchedule,
        is_temporarily_closed: true,
        manual_hours_override: "open",
      },
      MONDAY_8AM_DAMASCUS
    );
    expect(status.isOpen).toBe(true);
    expect(status.isAcceptingCustomerOrders).toBe(true);
  });

  it("manual closed override forces closed while schedule says open", () => {
    const status = computeRestaurantOpenStatus(
      {
        weekly_opening_hours: weekdaySchedule,
        manual_hours_override: "closed",
      },
      MONDAY_10AM_DAMASCUS
    );
    expect(status.isOpen).toBe(false);
  });
});

describe("customer order guard message", () => {
  it("exports a clear closed message for API rejection", () => {
    expect(CUSTOMER_ORDER_CLOSED_MESSAGE).toContain("مغلق");
    expect(isRestaurantOpenForOrders({ is_temporarily_closed: true })).toBe(
      false
    );
  });
});

describe("manual admin orders while closed", () => {
  it("does not use isRestaurantOpenForOrders for staff paths (contract)", () => {
    const closed = computeRestaurantOpenStatus(
      { is_temporarily_closed: true },
      MONDAY_10AM_DAMASCUS
    );
    expect(closed.isAcceptingCustomerOrders).toBe(false);
    expect(closed.isOpen).toBe(false);
  });
});
