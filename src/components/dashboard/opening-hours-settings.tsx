"use client";

import {
  DAY_KEYS,
  DAY_LABELS_AR,
  type WeeklyOpeningHours,
} from "@/lib/hours/types";
import { inputClassName, labelClassName } from "@/components/dashboard/form-ui";
import type { RestaurantSettings } from "@/types/database";

function getDaySlot(
  schedule: WeeklyOpeningHours,
  day: (typeof DAY_KEYS)[number]
) {
  const slots = schedule[day] ?? [];
  const first = slots[0];
  return {
    enabled: slots.length > 0,
    open: first?.open ?? "10:00",
    close: first?.close ?? "23:00",
  };
}

export function OpeningHoursSettings({
  settings,
}: {
  settings: RestaurantSettings;
}) {
  const schedule = settings.weekly_opening_hours;

  return (
    <section className="space-y-4 rounded-xl border border-brand-border bg-brand-cream/40 p-4">
      <div>
        <h3 className="font-semibold text-brand-chocolate">ساعات العمل</h3>
        <p className="mt-1 text-xs text-brand-muted">
          جميع الأوقات بتوقيت دمشق (Asia/Damascus). يمكنك دعم الإغلاق بعد منتصف
          الليل (مثل 18:00 — 02:00).
        </p>
      </div>

      <div className="space-y-3">
        {DAY_KEYS.map((day) => {
          const { enabled, open, close } = getDaySlot(schedule, day);
          return (
            <div
              key={day}
              className="grid gap-3 rounded-lg border border-brand-border/70 bg-brand-surface p-3 sm:grid-cols-[1fr_auto_auto_auto]"
            >
              <label className="flex items-center gap-2 text-sm font-bold text-brand-chocolate">
                <input
                  type="checkbox"
                  name={`hours_${day}_enabled`}
                  defaultChecked={enabled}
                  className="h-4 w-4 rounded border-brand-border text-brand-orange focus:ring-brand-orange"
                />
                {DAY_LABELS_AR[day]}
              </label>
              <div>
                <label className={labelClassName()} htmlFor={`hours_${day}_open`}>
                  فتح
                </label>
                <input
                  id={`hours_${day}_open`}
                  name={`hours_${day}_open`}
                  type="time"
                  defaultValue={open}
                  className={inputClassName()}
                />
              </div>
              <div>
                <label className={labelClassName()} htmlFor={`hours_${day}_close`}>
                  إغلاق
                </label>
                <input
                  id={`hours_${day}_close`}
                  name={`hours_${day}_close`}
                  type="time"
                  defaultValue={close}
                  className={inputClassName()}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3 border-t border-brand-border/70 pt-4">
        <label className="flex items-center gap-2 text-sm font-bold text-brand-chocolate">
          <input
            type="checkbox"
            name="is_temporarily_closed"
            defaultChecked={settings.is_temporarily_closed}
            className="h-4 w-4 rounded border-brand-border text-brand-orange focus:ring-brand-orange"
          />
          إغلاق المطعم مؤقتاً
        </label>

        <div>
          <label className={labelClassName()} htmlFor="temporary_closure_message">
            رسالة الإغلاق المؤقت (اختياري)
          </label>
          <textarea
            id="temporary_closure_message"
            name="temporary_closure_message"
            rows={2}
            defaultValue={settings.temporary_closure_message ?? ""}
            className={inputClassName()}
            placeholder="المطعم مغلق مؤقتاً وسنعود قريباً"
          />
        </div>
      </div>

      <div className="space-y-3 border-t border-brand-border/70 pt-4">
        <p className="text-sm font-bold text-brand-chocolate">تجاوز يدوي للحالة</p>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-brand-chocolate">
            <input
              type="radio"
              name="manual_hours_override"
              value="open"
              defaultChecked={settings.manual_hours_override === "open"}
              className="text-brand-orange focus:ring-brand-orange"
            />
            فتح المطعم الآن
          </label>
          <label className="flex items-center gap-2 text-sm text-brand-chocolate">
            <input
              type="radio"
              name="manual_hours_override"
              value="closed"
              defaultChecked={settings.manual_hours_override === "closed"}
              className="text-brand-orange focus:ring-brand-orange"
            />
            إغلاق المطعم الآن
          </label>
          <label className="flex items-center gap-2 text-sm text-brand-muted">
            <input
              type="checkbox"
              name="manual_hours_override_clear"
              defaultChecked={!settings.manual_hours_override}
              className="h-4 w-4 rounded border-brand-border text-brand-orange focus:ring-brand-orange"
            />
            بدون تجاوز (اتباع الجدول)
          </label>
        </div>
      </div>

      <details className="text-xs text-brand-muted">
        <summary className="cursor-pointer font-medium text-brand-chocolate">
          حقل ساعات العمل القديم (للتوافق فقط)
        </summary>
        <textarea
          id="opening_hours"
          name="opening_hours"
          rows={2}
          defaultValue={settings.opening_hours ?? ""}
          className={`${inputClassName()} mt-2`}
          placeholder="لم يعد يُعرض للعملاء — استخدم الجدول أعلاه"
        />
      </details>
    </section>
  );
}
