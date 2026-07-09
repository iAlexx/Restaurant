import { requireStaffPage } from "@/lib/auth/staff-page";
import { getDailyReportForStaff } from "@/lib/actions/reports";
import { RESTAURANT_TIMEZONE } from "@/lib/orders/status-transitions";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/form-ui";
import { ReportsDashboard } from "@/components/dashboard/reports-dashboard";

export default async function ReportsPage() {
  await requireStaffPage("/dashboard/reports");

  const [report, settings] = await Promise.all([
    getDailyReportForStaff(),
    createClient()
      .then((supabase) =>
        supabase
          .from("restaurant_settings")
          .select("currency_label")
          .eq("id", 1)
          .single()
      ),
  ]);

  const currencyLabel =
    (settings.data as { currency_label: string } | null)?.currency_label ?? "ل.س";

  return (
    <div className="space-y-6">
      <PageHeader
        title="التقرير اليومي"
        description={`تاريخ اليوم: ${report.date} — بتوقيت ${RESTAURANT_TIMEZONE} (UTC+3). الطلبات الملغاة لا تُحسب في الإجمالي أو القيمة.`}
      />

      <ReportsDashboard report={report} currencyLabel={currencyLabel} />
    </div>
  );
}
