import { describe, expect, it } from "vitest";
import {
  getStalePrintDevices,
  isPrintDeviceStale,
} from "@/lib/dashboard/print-health";

describe("print health banner helpers", () => {
  const now = Date.parse("2026-07-10T12:00:00.000Z");

  it("marks device stale after 2 minutes without heartbeat", () => {
    const heartbeat = "2026-07-10T11:57:00.000Z";
    expect(isPrintDeviceStale(heartbeat, now)).toBe(true);
  });

  it("keeps device healthy within 2 minutes", () => {
    const heartbeat = "2026-07-10T11:59:30.000Z";
    expect(isPrintDeviceStale(heartbeat, now)).toBe(false);
  });

  it("returns stale active devices for banner", () => {
    const devices = getStalePrintDevices(
      [
        {
          name: "Kitchen",
          last_heartbeat_at: "2026-07-10T11:57:00.000Z",
          last_error: null,
        },
        {
          name: "Bar",
          last_heartbeat_at: "2026-07-10T11:59:50.000Z",
          last_error: null,
        },
      ],
      now
    );

    expect(devices).toHaveLength(1);
    expect(devices[0]?.name).toBe("Kitchen");
  });
});
