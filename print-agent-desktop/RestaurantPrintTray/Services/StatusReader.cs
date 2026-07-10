using System.Text.Json;
using RestaurantPrintTray.Models;

namespace RestaurantPrintTray.Services;

public sealed class StatusReader
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public AgentStatus Read()
    {
        try
        {
            if (!File.Exists(AppPaths.StatusFile))
            {
                return CreateFallback();
            }

            var json = File.ReadAllText(AppPaths.StatusFile);
            return JsonSerializer.Deserialize<AgentStatus>(json, JsonOptions) ?? CreateFallback();
        }
        catch
        {
            return CreateFallback();
        }
    }

    private static AgentStatus CreateFallback()
    {
        var configService = new ConfigService();
        var config = configService.LoadConfig();

        return new AgentStatus
        {
            UpdatedAt = DateTime.UtcNow.ToString("O"),
            AgentRunning = false,
            TrayState = configService.IsConfigured() ? "no_internet" : "invalid_token",
            TrayStateLabel = configService.IsConfigured() ? "لا يوجد إنترنت" : "التوكن غير صالح",
            ApiBaseUrl = config.ApiBaseUrl,
            PrinterName = config.WindowsPrinterName,
            DashboardUrl = $"{config.ApiBaseUrl.TrimEnd('/')}/dashboard/orders",
        };
    }
}
