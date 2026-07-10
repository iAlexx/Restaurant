using System.Diagnostics;
using System.Drawing.Printing;

namespace RestaurantPrintTray.Services;

public static class PrinterService
{
    public static IReadOnlyList<string> ListInstalledPrinters()
    {
        var printers = new List<string>();
        foreach (string printer in PrinterSettings.InstalledPrinters)
        {
            printers.Add(printer);
        }

        return printers;
    }
}

public static class ScheduledTaskService
{
    public static void RemoveLegacyAgentTask()
    {
        RunSchtasks($"/Delete /TN \"{AppPaths.LegacyAgentTaskName}\" /F", ignoreErrors: true);
    }

    public static void EnsureTrayAutoStart(string trayExecutablePath)
    {
        RemoveLegacyAgentTask();

        var escapedPath = $"\\\"{trayExecutablePath}\\\"";
        var createArgs =
            $"/Create /TN \"{AppPaths.TrayTaskName}\" /TR {escapedPath} /SC ONLOGON /RL LIMITED /F";
        TrayBootstrapLogger.Info($"Creating scheduled task: {createArgs}");
        RunSchtasks(createArgs, ignoreErrors: false);
    }

    public static void RemoveTrayAutoStart()
    {
        RunSchtasks($"/Delete /TN \"{AppPaths.TrayTaskName}\" /F", ignoreErrors: true);
    }

    private static void RunSchtasks(string arguments, bool ignoreErrors)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = "schtasks.exe",
            Arguments = arguments,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        using var process = Process.Start(startInfo);
        process?.WaitForExit(15000);

        if (!ignoreErrors && process is { ExitCode: not 0 })
        {
            throw new InvalidOperationException($"schtasks failed: {arguments}");
        }
    }
}
