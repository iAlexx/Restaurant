using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using RestaurantPrintTray.Models;

namespace RestaurantPrintTray.Services;

public sealed class ConfigService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
    };

    public void MigrateLegacyConfig()
    {
        Directory.CreateDirectory(AppPaths.ConfigDirectory);

        var files = new[]
        {
            "config.json",
            "device-token.dpapi",
            "pending-acks.json",
        };

        foreach (var file in files)
        {
            var from = Path.Combine(AppPaths.LegacyConfigDirectory, file);
            var to = Path.Combine(AppPaths.ConfigDirectory, file);
            if (File.Exists(from) && !File.Exists(to))
            {
                File.Copy(from, to, overwrite: false);
            }
        }

        if (!Directory.Exists(AppPaths.LegacyConfigDirectory))
        {
            return;
        }

        foreach (var log in Directory.GetFiles(AppPaths.LegacyConfigDirectory, "*.log"))
        {
            var target = Path.Combine(AppPaths.ConfigDirectory, Path.GetFileName(log));
            if (!File.Exists(target))
            {
                File.Copy(log, target, overwrite: false);
            }
        }
    }

    public bool IsConfigured()
    {
        return File.Exists(AppPaths.ConfigFile) && File.Exists(AppPaths.TokenFile);
    }

    public AgentConfig LoadConfig()
    {
        if (!File.Exists(AppPaths.ConfigFile))
        {
            return new AgentConfig();
        }

        var json = File.ReadAllText(AppPaths.ConfigFile, Encoding.UTF8);
        return JsonSerializer.Deserialize<AgentConfig>(json, JsonOptions) ?? new AgentConfig();
    }

    public void SaveConfig(AgentConfig config, string deviceToken)
    {
        Directory.CreateDirectory(AppPaths.ConfigDirectory);

        var json = JsonSerializer.Serialize(config, JsonOptions);
        File.WriteAllText(AppPaths.ConfigFile, json, Encoding.UTF8);
        TokenStore.SaveToken(deviceToken);
    }

    public void UpdatePrinter(string printerName)
    {
        var config = LoadConfig();
        config.WindowsPrinterName = printerName;
        var json = JsonSerializer.Serialize(config, JsonOptions);
        File.WriteAllText(AppPaths.ConfigFile, json, Encoding.UTF8);
    }
}

public static class TokenStore
{
    public static void SaveToken(string token)
    {
        var trimmed = token.Trim();
        if (string.IsNullOrEmpty(trimmed))
        {
            throw new InvalidOperationException("رمز الجهاز فارغ");
        }

        Directory.CreateDirectory(AppPaths.ConfigDirectory);
        var bytes = Encoding.UTF8.GetBytes(trimmed);
        var protectedBytes = ProtectedData.Protect(bytes, null, DataProtectionScope.CurrentUser);
        File.WriteAllText(AppPaths.TokenFile, Convert.ToBase64String(protectedBytes), Encoding.ASCII);
    }

    public static bool HasToken() => File.Exists(AppPaths.TokenFile);
}
