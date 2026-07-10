using System.Text;

namespace RestaurantPrintTray.Services;

public static class TrayBootstrapLogger
{
    private static readonly object Gate = new();

    public static void Info(string message) => Write("INFO", message);

    public static void Warn(string message) => Write("WARN", message);

    public static void Error(string message, Exception? ex = null)
    {
        var text = ex == null ? message : $"{message}{Environment.NewLine}{ex}";
        Write("ERROR", text);
    }

    private static void Write(string level, string message)
    {
        try
        {
            Directory.CreateDirectory(AppPaths.LogsDirectory);
            var line =
                $"[{DateTime.UtcNow:O}] [{level}] {message}{Environment.NewLine}";

            lock (Gate)
            {
                File.AppendAllText(BootstrapLogPath(), line, Encoding.UTF8);
            }
        }
        catch
        {
            // bootstrap logging must never crash the tray
        }
    }

    public static string BootstrapLogPath() =>
        Path.Combine(AppPaths.LogsDirectory, "tray-bootstrap.log");
}
