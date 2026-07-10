using RestaurantPrintTray.Models;

namespace RestaurantPrintTray.Services;

public sealed class SettingsCoordinator
{
    private readonly ConfigService _configService;
    private readonly Func<IReadOnlyList<string>> _listPrinters;

    public SettingsCoordinator(
        ConfigService configService,
        Func<IReadOnlyList<string>>? listPrinters = null)
    {
        _configService = configService;
        _listPrinters = listPrinters ?? PrinterService.ListInstalledPrinters;
    }

    public SettingsSaveResult TrySave(SettingsSaveInput input, Action restartAgent)
    {
        var hasStoredToken = TokenStore.ValidateStoredToken();
        var errors = SettingsValidator.Validate(
            input,
            _listPrinters(),
            hasStoredToken);

        if (errors.Count > 0)
        {
            return SettingsSaveResult.Failed(errors.ToArray());
        }

        var config = _configService.LoadConfig();
        config.ApiBaseUrl = input.ApiBaseUrl.Trim();
        config.WindowsPrinterName = input.PrinterName.Trim();
        config.PollIntervalMs = input.PollIntervalMs;
        config.PrintMode = "windows";

        if (input.ReplaceToken || !hasStoredToken)
        {
            _configService.SaveConfig(config, input.NewToken!.Trim());
        }
        else
        {
            _configService.SaveConfigKeepingToken(config);
        }

        restartAgent();
        return SettingsSaveResult.Succeeded();
    }
}
