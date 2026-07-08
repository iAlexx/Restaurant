import { requireAdminPage } from "@/lib/auth/admin-page";
import {
  getRestaurantSettings,
  listPrintDevices,
} from "@/lib/actions/settings";
import { PrintDeviceSection, SettingsForm } from "@/components/dashboard/settings-form";
import { PageHeader } from "@/components/dashboard/form-ui";

export default async function SettingsPage() {
  await requireAdminPage();
  const [settings, devices] = await Promise.all([
    getRestaurantSettings(),
    listPrintDevices(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإعدادات"
        description="إعدادات المطعم وأجهزة الطباعة"
      />

      <SettingsForm settings={settings} />
      <PrintDeviceSection devices={devices} />
    </div>
  );
}
