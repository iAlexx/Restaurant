import { requireAdminPage } from "@/lib/auth/admin-page";
import {
  getRestaurantSettings,
  listPrintDevices,
} from "@/lib/actions/settings";
import { PrintDeviceSection, SettingsForm } from "@/components/dashboard/settings-form";

export default async function SettingsPage() {
  await requireAdminPage();
  const [settings, devices] = await Promise.all([
    getRestaurantSettings(),
    listPrintDevices(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">الإعدادات</h1>
        <p className="mt-1 text-sm text-stone-600">
          إعدادات المطعم وأجهزة الطباعة
        </p>
      </div>

      <SettingsForm settings={settings} />
      <PrintDeviceSection devices={devices} />
    </div>
  );
}
