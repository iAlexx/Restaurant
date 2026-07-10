namespace RestaurantPrintTray.Models;

public sealed class SettingsSaveInput
{
    public string ApiBaseUrl { get; set; } = "";
    public string PrinterName { get; set; } = "";
    public int PollIntervalMs { get; set; } = 4000;
    public bool ReplaceToken { get; set; }
    public string? NewToken { get; set; }
}

public sealed class SettingsSaveResult
{
    public bool Success { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = [];

    public static SettingsSaveResult Succeeded() => new() { Success = true };

    public static SettingsSaveResult Failed(params string[] errors) =>
        new() { Success = false, Errors = errors };
}
