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

    public bool IsConfigured() => GetConfigurationState() == ConfigurationState.Valid;

    public ConfigurationState GetConfigurationState()
    {
        if (!File.Exists(AppPaths.ConfigFile) || !File.Exists(AppPaths.TokenFile))
        {
            return ConfigurationState.Missing;
        }

        try
        {
            var config = LoadConfig();
            var printers = PrinterService.ListInstalledPrinters();
            var validation = SettingsValidator.Validate(
                new SettingsSaveInput
                {
                    ApiBaseUrl = config.ApiBaseUrl,
                    PrinterName = config.WindowsPrinterName,
                    PollIntervalMs = config.PollIntervalMs,
                    ReplaceToken = false,
                },
                printers,
                hasStoredToken: true);

            if (validation.Count > 0 || !TokenStore.ValidateStoredToken())
            {
                return ConfigurationState.Invalid;
            }

            return ConfigurationState.Valid;
        }
        catch
        {
            return ConfigurationState.Invalid;
        }
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

    public void SaveConfigKeepingToken(AgentConfig config)
    {
        if (!TokenStore.ValidateStoredToken())
        {
            throw new InvalidOperationException("لا يوجد رمز محفوظ لتحديث الإعدادات بدونه");
        }

        Directory.CreateDirectory(AppPaths.ConfigDirectory);
        var json = JsonSerializer.Serialize(config, JsonOptions);
        File.WriteAllText(AppPaths.ConfigFile, json, Encoding.UTF8);
    }

    public void UpdatePrinter(string printerName)
    {
        var config = LoadConfig();
        config.WindowsPrinterName = printerName;
        SaveConfigKeepingToken(config);
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

    public static bool ValidateStoredToken()
    {
        if (!File.Exists(AppPaths.TokenFile))
        {
            return false;
        }

        try
        {
            var raw = File.ReadAllText(AppPaths.TokenFile, Encoding.ASCII).Trim();
            if (string.IsNullOrEmpty(raw))
            {
                return false;
            }

            var protectedBytes = Convert.FromBase64String(raw);
            var bytes = ProtectedData.Unprotect(
                protectedBytes,
                null,
                DataProtectionScope.CurrentUser);
            var token = Encoding.UTF8.GetString(bytes).Trim();
            return token.Length > 0;
        }
        catch
        {
            return false;
        }
    }
}
