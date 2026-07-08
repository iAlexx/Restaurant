"use client";

import { useActionState, useState } from "react";
import {
  createPrintDevice,
  updateRestaurantSettings,
  revokePrintDevice,
  type PrintDeviceListItem,
} from "@/lib/actions/settings";
import type { ActionResult, ActionResultWithToken } from "@/lib/actions/types";
import { uploadMenuImage } from "@/lib/actions/upload";
import {
  FormAlert,
  Badge,
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-ui";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import type { RestaurantSettings } from "@/types/database";
import { formatPrice } from "@/lib/money";
import { useTransition } from "react";

const initial: ActionResult = {};

export function SettingsForm({ settings }: { settings: RestaurantSettings }) {
  const [state, formAction, pending] = useActionState(updateRestaurantSettings, initial);
  const [logoUrl, setLogoUrl] = useState(settings.logo_url ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadMenuImage(formData, "logo");
    setUploading(false);

    if (result.error) {
      setUploadError(result.error);
      return;
    }
    if (result.url) setLogoUrl(result.url);
  }

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="font-semibold text-stone-900">إعدادات المطعم</h2>
      <FormAlert message={state.error} type="error" />
      <FormAlert message={state.success} type="success" />
      <FormAlert message={uploadError ?? undefined} type="error" />

      <input type="hidden" name="logo_url" value={logoUrl} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClassName()} htmlFor="name">اسم المطعم</label>
          <input id="name" name="name" required defaultValue={settings.name} className={inputClassName()} />
        </div>
        <div>
          <label className={labelClassName()} htmlFor="currency_label">رمز العملة</label>
          <input
            id="currency_label"
            name="currency_label"
            required
            defaultValue={settings.currency_label}
            className={inputClassName()}
          />
        </div>
        <div>
          <label className={labelClassName()} htmlFor="phone">هاتف المطعم</label>
          <input id="phone" name="phone" defaultValue={settings.phone ?? ""} className={inputClassName()} dir="ltr" />
        </div>
        <div>
          <label className={labelClassName()} htmlFor="whatsapp_phone">واتساب الطلبات</label>
          <input
            id="whatsapp_phone"
            name="whatsapp_phone"
            defaultValue={settings.whatsapp_phone ?? ""}
            className={inputClassName()}
            dir="ltr"
          />
        </div>
      </div>

      <div>
        <label className={labelClassName()} htmlFor="address">العنوان</label>
        <textarea id="address" name="address" rows={2} defaultValue={settings.address ?? ""} className={inputClassName()} />
      </div>

      <div>
        <label className={labelClassName()} htmlFor="opening_hours">ساعات العمل</label>
        <textarea
          id="opening_hours"
          name="opening_hours"
          rows={2}
          defaultValue={settings.opening_hours ?? ""}
          className={inputClassName()}
          placeholder="مثال: 10:00 - 23:00"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClassName()} htmlFor="default_delivery_fee">
            رسوم التوصيل (عدد صحيح)
          </label>
          <input
            id="default_delivery_fee"
            name="default_delivery_fee"
            type="number"
            min={0}
            step={1}
            defaultValue={settings.default_delivery_fee}
            className={inputClassName()}
          />
          <p className="mt-1 text-xs text-stone-500">
            {formatPrice(settings.default_delivery_fee, settings.currency_label)}
          </p>
        </div>
        <div>
          <label className={labelClassName()} htmlFor="min_delivery_order">
            الحد الأدنى للتوصيل (عدد صحيح)
          </label>
          <input
            id="min_delivery_order"
            name="min_delivery_order"
            type="number"
            min={0}
            step={1}
            defaultValue={settings.min_delivery_order}
            className={inputClassName()}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="delivery_enabled" defaultChecked={settings.delivery_enabled} />
          تفعيل التوصيل
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="pickup_enabled" defaultChecked={settings.pickup_enabled} />
          تفعيل الاستلام
        </label>
      </div>

      <div>
        <label className={labelClassName()} htmlFor="receipt_header">ترويسة الإيصال</label>
        <input id="receipt_header" name="receipt_header" defaultValue={settings.receipt_header ?? ""} className={inputClassName()} />
      </div>

      <div>
        <label className={labelClassName()} htmlFor="receipt_footer">ذيل الإيصال</label>
        <input id="receipt_footer" name="receipt_footer" defaultValue={settings.receipt_footer ?? ""} className={inputClassName()} />
      </div>

      <div>
        <label className={labelClassName()}>شعار المطعم</label>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} />
        {uploading ? <p className="text-xs text-stone-500">جاري الرفع...</p> : null}
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="mt-2 h-16 w-16 rounded object-cover" />
        ) : null}
      </div>

      <button type="submit" disabled={pending || uploading} className={buttonPrimaryClassName()}>
        {pending ? "جاري الحفظ..." : "حفظ الإعدادات"}
      </button>
    </form>
  );
}

export function PrintDeviceSection({ devices }: { devices: PrintDeviceListItem[] }) {
  const [state, formAction, pending] = useActionState(createPrintDevice, initial as ActionResultWithToken);
  const [revokePending, startRevoke] = useTransition();
  const [confirmDevice, setConfirmDevice] = useState<{
    id: string;
    name: string;
  } | null>(null);

  return (
    <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="font-semibold text-stone-900">أجهزة الطباعة</h2>
      <p className="text-sm text-stone-600">
        أنشئ رمزاً لجهاز Windows Print Agent. يُعرض الرمز مرة واحدة فقط.
      </p>

      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label className={labelClassName()} htmlFor="device-name">اسم الجهاز</label>
          <input id="device-name" name="name" required placeholder="كاشير - لابتوب" className={inputClassName()} />
        </div>
        <button type="submit" disabled={pending} className={buttonPrimaryClassName()}>
          {pending ? "..." : "إنشاء رمز"}
        </button>
      </form>

      <FormAlert message={state.error} type="error" />
      <FormAlert message={state.success} type="success" />

      {state.token ? (
        <div className="rounded-lg bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-900">انسخ الرمز الآن:</p>
          <code className="mt-2 block break-all text-xs" dir="ltr">
            {state.token}
          </code>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              <th className="px-3 py-2 text-start">الاسم</th>
              <th className="px-3 py-2 text-start">الحالة</th>
              <th className="px-3 py-2 text-start">آخر نبضة</th>
              <th className="px-3 py-2 text-start">آخر خطأ</th>
              <th className="px-3 py-2 text-start">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {devices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-stone-500">
                  لا توجد أجهزة مسجلة
                </td>
              </tr>
            ) : (
              devices.map((device) => (
                <tr key={device.id} className="border-t border-stone-100">
                  <td className="px-3 py-2 font-medium text-stone-800">
                    {device.name}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={device.is_active ? "green" : "stone"}>
                      {device.is_active ? "نشط" : "ملغى"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-xs text-stone-500">
                    {device.last_heartbeat_at
                      ? new Date(device.last_heartbeat_at).toLocaleString("ar-SY")
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-red-600">
                    {device.last_error ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {device.is_active ? (
                      <button
                        type="button"
                        disabled={revokePending}
                        className={buttonSecondaryClassName()}
                        onClick={() =>
                          setConfirmDevice({
                            id: device.id,
                            name: device.name,
                          })
                        }
                      >
                        إلغاء
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmDevice !== null}
        title="إلغاء رمز الجهاز؟"
        description={
          confirmDevice
            ? `سيتوقف الجهاز "${confirmDevice.name}" عن الطباعة فوراً ولن يعمل رمزه مجدداً. هذا الإجراء لا يمكن التراجع عنه.`
            : undefined
        }
        confirmLabel="إلغاء الرمز"
        tone="danger"
        pending={revokePending}
        onCancel={() => setConfirmDevice(null)}
        onConfirm={() => {
          const id = confirmDevice?.id;
          setConfirmDevice(null);
          if (!id) return;
          startRevoke(async () => {
            await revokePrintDevice(id);
          });
        }}
      />
    </div>
  );
}
