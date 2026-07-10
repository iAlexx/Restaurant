namespace RestaurantPrintTray.Services;

public static class AppPaths
{
    public const string TrayTaskName = "RestaurantPrintTray";
    public const string LegacyAgentTaskName = "RestaurantPrintAgent";

    public static string? OverrideConfigDirectoryForTests { get; set; }

    public static string InstallDirectory =>
        Path.GetDirectoryName(Environment.ProcessPath)
        ?? AppContext.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);

    public static string AgentExecutable =>
        Path.Combine(InstallDirectory, "RestaurantPrintAgent.exe");

    public static string ConfigDirectory
    {
        get
        {
            if (!string.IsNullOrWhiteSpace(OverrideConfigDirectoryForTests))
            {
                return OverrideConfigDirectoryForTests;
            }

            var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            return Path.Combine(localAppData, "RestaurantPrint");
        }
    }

    public static string LegacyConfigDirectory
    {
        get
        {
            var profile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            return Path.Combine(profile, ".restaurant-print");
        }
    }

    public static string ConfigFile => Path.Combine(ConfigDirectory, "config.json");
    public static string TokenFile => Path.Combine(ConfigDirectory, "device-token.dpapi");
    public static string StatusFile => Path.Combine(ConfigDirectory, "status.json");
    public static string PendingAcksFile => Path.Combine(ConfigDirectory, "pending-acks.json");
    public static string LogsDirectory => Path.Combine(ConfigDirectory, "logs");
    public static string FontsDirectory => Path.Combine(InstallDirectory, "assets", "fonts");
}
