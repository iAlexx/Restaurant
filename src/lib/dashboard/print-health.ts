export interface PrintDeviceHealth {
  name: string;
  last_heartbeat_at: string | null;
  last_error: string | null;
}

export const STALE_HEARTBEAT_MS = 2 * 60 * 1000;

export function isPrintDeviceStale(
  lastHeartbeatAt: string | null,
  nowMs: number = Date.now()
): boolean {
  if (!lastHeartbeatAt) return true;
  const heartbeatMs = new Date(lastHeartbeatAt).getTime();
  if (Number.isNaN(heartbeatMs)) return true;
  return nowMs - heartbeatMs > STALE_HEARTBEAT_MS;
}

export function getStalePrintDevices(
  devices: PrintDeviceHealth[],
  nowMs: number = Date.now()
): PrintDeviceHealth[] {
  return devices.filter((device) =>
    isPrintDeviceStale(device.last_heartbeat_at, nowMs)
  );
}
