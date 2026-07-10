using RestaurantPrintTray.Services;

namespace RestaurantPrintTray;

internal static class Program
{
    private const string MutexName = "Global\\RestaurantPrintTray.SingleInstance";

    [STAThread]
    private static void Main(string[] args)
    {
        using var mutex = new Mutex(true, MutexName, out var createdNew);
        if (!createdNew)
        {
            MessageBox.Show(
                "تطبيق وكيل الطباعة يعمل بالفعل في أيقونة النظام.",
                "مطعم النخة",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information);
            return;
        }

        ApplicationConfiguration.Initialize();
        Application.SetHighDpiMode(HighDpiMode.SystemAware);

        var configService = new ConfigService();
        configService.MigrateLegacyConfig();

        if (args.Contains("--register-autostart", StringComparer.OrdinalIgnoreCase))
        {
            ScheduledTaskService.EnsureTrayAutoStart(Environment.ProcessPath!);
            return;
        }

        if (args.Contains("--unregister-autostart", StringComparer.OrdinalIgnoreCase))
        {
            ScheduledTaskService.RemoveTrayAutoStart();
            ScheduledTaskService.RemoveLegacyAgentTask();
            return;
        }

        Application.Run(new TrayApplicationContext());
    }
}
