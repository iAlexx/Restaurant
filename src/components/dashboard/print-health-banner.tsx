import Link from "next/link";
import {
  getStalePrintDevices,
  type PrintDeviceHealth,
} from "@/lib/dashboard/print-health";

export type { PrintDeviceHealth };

export function PrintHealthBanner({
  devices,
}: {
  devices: PrintDeviceHealth[];
}) {
  const staleDevices = getStalePrintDevices(devices);
  const devicesWithErrors = devices.filter((device) => device.last_error);

  if (staleDevices.length === 0 && devicesWithErrors.length === 0) {
    return null;
  }

  const latestError =
    devicesWithErrors
      .map((device) => device.last_error)
      .find((message) => message && message.trim().length > 0) ?? null;

  return (
    <div
      className="rounded-xl border border-brand-gold/50 bg-brand-gold-soft px-4 py-3 text-sm text-brand-chocolate"
      role="status"
    >
      <p className="font-bold text-brand-orange">تنبيه الطابعة</p>
      {staleDevices.length > 0 ? (
        <p className="mt-1 leading-relaxed">
          لم يُستلم نبض من وكيل الطباعة منذ أكثر من دقيقتين
          {staleDevices.length === 1
            ? ` (${staleDevices[0]?.name})`
            : ` (${staleDevices.length} أجهزة)`}
          . قد لا تُطبع الطلبات الجديدة تلقائياً.
        </p>
      ) : null}
      {latestError ? (
        <p className="mt-1 leading-relaxed">
          آخر خطأ طباعة: <span className="font-semibold">{latestError}</span>
        </p>
      ) : null}
      <Link
        href="/dashboard/settings"
        className="mt-2 inline-block font-semibold text-brand-orange underline-offset-2 hover:underline"
      >
        فتح إعدادات الطابعة والتشخيص
      </Link>
    </div>
  );
}
