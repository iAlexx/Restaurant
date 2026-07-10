using RestaurantPrintTray.Forms;
using RestaurantPrintTray.Models;
using RestaurantPrintTray.Services;

namespace RestaurantPrintTray;

public sealed class TrayApplicationContext : ApplicationContext
{
    private readonly ConfigService _configService = new();
    private readonly StatusReader _statusReader = new();
    private readonly AgentSupervisor _supervisor = new();
    private readonly AgentCommandService _commandService = new();
    private readonly NotifyIcon _notifyIcon;
    private readonly System.Windows.Forms.Timer _pollTimer = new() { Interval = 2500 };
    private StatusForm? _statusForm;

    public TrayApplicationContext()
    {
        _configService.MigrateLegacyConfig();

        _notifyIcon = new NotifyIcon
        {
            Icon = SystemIcons.Application,
            Visible = true,
            Text = "مطعم النخة — وكيل الطباعة",
        };

        _notifyIcon.ContextMenuStrip = BuildMenu();
        _notifyIcon.DoubleClick += (_, _) => ShowStatus();

        _pollTimer.Tick += (_, _) => UpdateTrayPresentation();
        _pollTimer.Start();

        Application.ApplicationExit += (_, _) => Shutdown();

        if (!EnsureConfigured())
        {
            return;
        }

        StartAgentSafe();
        _ = WaitForAgentBootstrapAsync();
        UpdateTrayPresentation();
    }

    private ContextMenuStrip BuildMenu()
    {
        var menu = new ContextMenuStrip
        {
            RightToLeft = RightToLeft.Yes,
            Font = new Font("Segoe UI", 10F),
        };

        menu.Items.Add("فتح الحالة", null, (_, _) => ShowStatus());
        menu.Items.Add("تجربة الطباعة", null, async (_, _) => await TestPrintAsync());
        menu.Items.Add("إعادة الاتصال", null, (_, _) => ReconnectAgent());
        menu.Items.Add("اختيار الطابعة", null, (_, _) => PickPrinter());
        menu.Items.Add("عرض آخر خطأ", null, (_, _) => ShowLastError());
        menu.Items.Add("فتح لوحة الطلبات", null, (_, _) => OpenDashboard());
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("الإعدادات", null, (_, _) => ShowSettings());
        menu.Items.Add("إعادة تشغيل معالج الإعداد", null, (_, _) => ShowSetupWizard(required: false));
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("خروج", null, (_, _) => ConfirmExit());

        return menu;
    }

    private bool EnsureConfigured()
    {
        var state = _configService.GetConfigurationState();
        if (state == ConfigurationState.Valid)
        {
            return true;
        }

        ShowSetupWizard(required: true);
        return _configService.GetConfigurationState() == ConfigurationState.Valid;
    }

    private void ShowSetupWizard(bool required)
    {
        using var wizard = new SetupWizardForm(ReconnectAgent);
        var result = wizard.ShowDialog();
        if (result != DialogResult.OK && required)
        {
            ExitThread();
        }
    }

    private void ShowSettings()
    {
        using var settings = new SettingsForm(ReconnectAgent);
        settings.ShowDialog();
        UpdateTrayPresentation();
    }

    private void StartAgentSafe()
    {
        try
        {
            TrayBootstrapLogger.Info("Tray requesting agent start");
            _supervisor.Start();
        }
        catch (Exception ex)
        {
            TrayBootstrapLogger.Error("Tray failed to start agent", ex);
            MessageBox.Show(
                ex.Message,
                "تعذر تشغيل وكيل الطباعة",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }

    private async Task WaitForAgentBootstrapAsync()
    {
        try
        {
            var ready = await _supervisor.WaitForStatusReadyAsync().ConfigureAwait(true);
            TrayBootstrapLogger.Info(
                ready
                    ? "Agent bootstrap complete (status.json ready)"
                    : "Agent bootstrap incomplete — check tray-bootstrap.log and agent logs");
            UpdateTrayPresentation();
        }
        catch (Exception ex)
        {
            TrayBootstrapLogger.Error("Agent bootstrap wait failed", ex);
        }
    }

    private void ReconnectAgent()
    {
        try
        {
            TrayBootstrapLogger.Info("Tray requested agent reconnect");
            _supervisor.Restart();
            _ = WaitForAgentBootstrapAsync();
            UpdateTrayPresentation();
        }
        catch (Exception ex)
        {
            TrayBootstrapLogger.Error("Tray reconnect failed", ex);
            MessageBox.Show(
                ex.Message,
                "إعادة الاتصال",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }

    private void ShowStatus()
    {
        if (_statusForm == null || _statusForm.IsDisposed)
        {
            _statusForm = new StatusForm(_supervisor);
            _statusForm.FormClosed += (_, _) => _statusForm = null;
            _statusForm.Show();
            _statusForm.BringToFront();
            return;
        }

        _statusForm.BringToFront();
    }

    private async Task TestPrintAsync()
    {
        _notifyIcon.ShowBalloonTip(
            2500,
            "تجربة الطباعة",
            "جاري إرسال صفحة الاختبار...",
            ToolTipIcon.Info);

        var (success, message) = await _commandService.TestPrintAsync();
        MessageBox.Show(
            message,
            success ? "تجربة الطباعة" : "فشل تجربة الطباعة",
            MessageBoxButtons.OK,
            success ? MessageBoxIcon.Information : MessageBoxIcon.Error);
    }

    private void PickPrinter()
    {
        using var picker = new PrinterPickerForm();
        if (picker.ShowDialog() == DialogResult.OK)
        {
            ReconnectAgent();
        }
    }

    private void ShowLastError()
    {
        var status = _statusReader.Read();
        var text = string.IsNullOrWhiteSpace(status.LastError)
            ? "لا يوجد خطأ مسجّل حالياً."
            : status.LastError;

        MessageBox.Show(text, "آخر خطأ", MessageBoxButtons.OK, MessageBoxIcon.Warning);
    }

    private void OpenDashboard()
    {
        var status = _statusReader.Read();
        var url = string.IsNullOrWhiteSpace(status.DashboardUrl)
            ? $"{_configService.LoadConfig().ApiBaseUrl.TrimEnd('/')}/dashboard/orders"
            : status.DashboardUrl;

        try
        {
            var psi = new System.Diagnostics.ProcessStartInfo
            {
                FileName = url,
                UseShellExecute = true,
            };
            System.Diagnostics.Process.Start(psi);
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "تعذر فتح لوحة الطلبات", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private void ConfirmExit()
    {
        var answer = MessageBox.Show(
            "هل تريد إيقاف وكيل الطباعة والخروج من أيقونة النظام؟",
            "تأكيد الخروج",
            MessageBoxButtons.YesNo,
            MessageBoxIcon.Question,
            MessageBoxDefaultButton.Button2);

        if (answer == DialogResult.Yes)
        {
            Shutdown();
            ExitThread();
        }
    }

    private void UpdateTrayPresentation()
    {
        var status = _statusReader.Read();
        var running = status.AgentRunning || _supervisor.IsRunning;
        var label = status.TrayStateLabel;

        if (!running && _configService.IsConfigured())
        {
            label = "الوكيل متوقف";
        }

        _notifyIcon.Text = Truncate($"مطعم النخة — {label}", 63);
    }

    private static string Truncate(string value, int max)
    {
        return value.Length <= max ? value : value[..(max - 1)] + "…";
    }

    private void Shutdown()
    {
        _pollTimer.Stop();
        _supervisor.Dispose();
        _notifyIcon.Visible = false;
        _notifyIcon.Dispose();
    }
}
