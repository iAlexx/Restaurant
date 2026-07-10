using RestaurantPrintTray.Models;
using RestaurantPrintTray.Services;

namespace RestaurantPrintTray.Forms;

public sealed class StatusForm : Form
{
    private readonly StatusReader _statusReader = new();
    private readonly ConfigService _configService = new();
    private readonly AgentSupervisor _supervisor;
    private readonly TextBox _detailsBox;
    private readonly System.Windows.Forms.Timer _timer = new() { Interval = 2000 };

    public StatusForm(AgentSupervisor supervisor)
    {
        _supervisor = supervisor;
        Text = "حالة وكيل الطباعة";
        RightToLeft = RightToLeft.Yes;
        RightToLeftLayout = true;
        Font = new Font("Segoe UI", 10F);
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(560, 420);

        _detailsBox = new TextBox
        {
            Multiline = true,
            ReadOnly = true,
            ScrollBars = ScrollBars.Vertical,
            Dock = DockStyle.Fill,
            Font = new Font("Consolas", 10F),
        };

        var refreshButton = new Button
        {
            Text = "تحديث",
            Dock = DockStyle.Bottom,
            Height = 36,
        };
        refreshButton.Click += (_, _) => RefreshStatus();

        Controls.Add(_detailsBox);
        Controls.Add(refreshButton);

        _timer.Tick += (_, _) => RefreshStatus();
        Shown += (_, _) =>
        {
            RefreshStatus();
            _timer.Start();
        };
        FormClosed += (_, _) => _timer.Stop();
    }

    private void RefreshStatus()
    {
        var status = _statusReader.Read();
        var config = _configService.LoadConfig();

        _detailsBox.Text =
            $"الحالة: {status.TrayStateLabel}\r\n" +
            $"الوكيل يعمل: {(status.AgentRunning || _supervisor.IsRunning ? "نعم" : "لا")}\r\n" +
            $"API: {status.ApiBaseUrl}\r\n" +
            $"الطابعة: {status.PrinterName}\r\n" +
            $"حالة الطابعة: {status.PrinterStatus}\r\n" +
            $"الرمز محفوظ: {(status.TokenConfigured ? "نعم" : "لا")}\r\n" +
            $"آخر نبضة: {status.LastHeartbeatAt ?? "—"}\r\n" +
            $"آخر خطأ: {status.LastError ?? "—"}\r\n" +
            $"آخر طباعة: {status.LastPrintAt ?? "—"}\r\n" +
            $"تأكيدات معلّقة: {status.PendingAckCount}\r\n" +
            $"مجلد الإعدادات: {AppPaths.ConfigDirectory}\r\n" +
            $"مجلد السجلات: {AppPaths.LogsDirectory}\r\n" +
            $"استطلاع: {config.PollIntervalMs}ms\r\n" +
            $"عرض الإيصال: {config.ReceiptWidthPx}px\r\n" +
            $"آخر تحديث: {status.UpdatedAt ?? "—"}";
    }
}
