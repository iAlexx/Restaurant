using System.Text;
using System.Text.Json;
using RestaurantPrintTray.Models;
using RestaurantPrintTray.Services;
using Xunit;

namespace RestaurantPrintTray.Tests;

public sealed class SettingsValidatorTests
{
    [Fact]
    public void ValidateApiUrl_requires_https()
    {
        var errors = SettingsValidator.ValidateApiUrl("http://insecure.example");
        Assert.Contains(errors, e => e.Contains("https://", StringComparison.Ordinal));
    }

    [Fact]
    public void Validate_requires_token_when_replacing()
    {
        var errors = SettingsValidator.Validate(
            new SettingsSaveInput
            {
                ApiBaseUrl = "https://alnkha.site",
                PrinterName = "POSPrinter POS80",
                PollIntervalMs = 4000,
                ReplaceToken = true,
                NewToken = "",
            },
            ["POSPrinter POS80"],
            hasStoredToken: true);

        Assert.Contains(errors, e => e.Contains("رمز الجهاز", StringComparison.Ordinal));
    }

    [Fact]
    public void Masked_token_label_never_contains_plaintext()
    {
        Assert.Equal("تم حفظ التوكن ••••", SettingsValidator.TokenSavedMaskedLabel);
        Assert.DoesNotContain("token", SettingsValidator.TokenSavedMaskedLabel, StringComparison.OrdinalIgnoreCase);
    }
}

public sealed class ConfigServiceTests : IDisposable
{
    private readonly string _tempDir;

    public ConfigServiceTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), "rpa-tray-tests-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_tempDir);
        AppPaths.OverrideConfigDirectoryForTests = _tempDir;
    }

    public void Dispose()
    {
        AppPaths.OverrideConfigDirectoryForTests = null;
        try
        {
            if (Directory.Exists(_tempDir))
            {
                Directory.Delete(_tempDir, recursive: true);
            }
        }
        catch
        {
            // ignore cleanup races on Windows temp locks
        }
    }

    [Fact]
    public void Missing_files_report_missing_configuration_state()
    {
        var service = new ConfigService();
        Assert.Equal(ConfigurationState.Missing, service.GetConfigurationState());
    }

    [Fact]
    public void Invalid_token_reports_invalid_configuration_state()
    {
        File.WriteAllText(AppPaths.ConfigFile, """{"apiBaseUrl":"https://alnkha.site","windowsPrinterName":"POSPrinter POS80","printMode":"windows","pollIntervalMs":4000,"lanHost":"","lanPort":9100,"receiptWidthPx":576}""");
        File.WriteAllText(AppPaths.TokenFile, Convert.ToBase64String([0x01, 0x02, 0x03, 0x04]));

        var service = new ConfigService();
        Assert.Equal(ConfigurationState.Invalid, service.GetConfigurationState());
    }

    [Fact]
    public void Valid_configuration_is_detected()
    {
        TokenStore.SaveToken("device-token-value");
        var config = new AgentConfig
        {
            ApiBaseUrl = "https://alnkha.site",
            WindowsPrinterName = "POSPrinter POS80",
        };
        File.WriteAllText(
            AppPaths.ConfigFile,
            JsonSerializer.Serialize(config),
            Encoding.UTF8);

        var service = new ConfigService();
        Assert.Equal(ConfigurationState.Valid, service.GetConfigurationState());
    }
}

public sealed class SettingsCoordinatorTests : IDisposable
{
    private readonly string _tempDir;

    public SettingsCoordinatorTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), "rpa-tray-tests-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_tempDir);
        AppPaths.OverrideConfigDirectoryForTests = _tempDir;
    }

    public void Dispose()
    {
        AppPaths.OverrideConfigDirectoryForTests = null;
        try
        {
            if (Directory.Exists(_tempDir))
            {
                Directory.Delete(_tempDir, recursive: true);
            }
        }
        catch
        {
            // ignore cleanup races on Windows temp locks
        }
    }

    [Fact]
    public void TrySave_replaces_token_and_restarts_agent()
    {
        TokenStore.SaveToken("old-token-value");
        var configService = new ConfigService();
        configService.SaveConfigKeepingToken(
            new AgentConfig
            {
                ApiBaseUrl = "https://alnkha.site",
                WindowsPrinterName = "POSPrinter POS80",
            });

        var restarted = false;
        var coordinator = new SettingsCoordinator(
            configService,
            () => ["POSPrinter POS80"]);

        var result = coordinator.TrySave(
            new SettingsSaveInput
            {
                ApiBaseUrl = "https://alnkha.site",
                PrinterName = "POSPrinter POS80",
                PollIntervalMs = 5000,
                ReplaceToken = true,
                NewToken = "new-token-value",
            },
            () => restarted = true);

        Assert.True(result.Success);
        Assert.True(restarted);
        Assert.True(TokenStore.ValidateStoredToken());

        var saved = configService.LoadConfig();
        Assert.Equal(5000, saved.PollIntervalMs);
        Assert.DoesNotContain("new-token", JsonSerializer.Serialize(saved), StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("new-token", JsonSerializer.Serialize(result), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void TrySave_without_token_change_keeps_existing_token()
    {
        TokenStore.SaveToken("existing-token");
        var configService = new ConfigService();
        configService.SaveConfigKeepingToken(
            new AgentConfig
            {
                ApiBaseUrl = "https://alnkha.site",
                WindowsPrinterName = "POSPrinter POS80",
            });

        var before = File.ReadAllText(AppPaths.TokenFile);
        var coordinator = new SettingsCoordinator(
            configService,
            () => ["POSPrinter POS80"]);

        var result = coordinator.TrySave(
            new SettingsSaveInput
            {
                ApiBaseUrl = "https://api.example.com",
                PrinterName = "POSPrinter POS80",
                PollIntervalMs = 4000,
                ReplaceToken = false,
            },
            () => { });

        Assert.True(result.Success);
        Assert.Equal(before, File.ReadAllText(AppPaths.TokenFile));
        Assert.Equal("https://api.example.com", configService.LoadConfig().ApiBaseUrl);
    }

    [Fact]
    public void Token_is_never_returned_from_config_service_surface()
    {
        var methods = typeof(ConfigService).GetMethods()
            .Concat(typeof(TokenStore).GetMethods())
            .Select(m => m.Name)
            .ToArray();

        Assert.DoesNotContain(methods, name => name.Contains("ReadToken", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(methods, name => name.Contains("GetToken", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(methods, name => name.Contains("Decrypt", StringComparison.OrdinalIgnoreCase));
    }
}
