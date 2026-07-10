using System.Text.Json.Serialization;

namespace RestaurantPrintTray.Models;

public sealed class AgentConfig
{
    public string ApiBaseUrl { get; set; } = "https://alnkha.site";
    public string WindowsPrinterName { get; set; } = "POSPrinter POS80";
    public string PrintMode { get; set; } = "windows";
    public int PollIntervalMs { get; set; } = 4000;
    public string LanHost { get; set; } = "";
    public int LanPort { get; set; } = 9100;
    public int ReceiptWidthPx { get; set; } = 576;
}

public sealed class AgentStatus
{
    [JsonPropertyName("updatedAt")]
    public string? UpdatedAt { get; set; }

    [JsonPropertyName("agentRunning")]
    public bool AgentRunning { get; set; }

    [JsonPropertyName("trayState")]
    public string TrayState { get; set; } = "no_internet";

    [JsonPropertyName("trayStateLabel")]
    public string TrayStateLabel { get; set; } = "لا يوجد إنترنت";

    [JsonPropertyName("apiBaseUrl")]
    public string ApiBaseUrl { get; set; } = "";

    [JsonPropertyName("printerName")]
    public string PrinterName { get; set; } = "";

    [JsonPropertyName("printMode")]
    public string PrintMode { get; set; } = "windows";

    [JsonPropertyName("printerStatus")]
    public string PrinterStatus { get; set; } = "error";

    [JsonPropertyName("tokenConfigured")]
    public bool TokenConfigured { get; set; }

    [JsonPropertyName("lastHeartbeatAt")]
    public string? LastHeartbeatAt { get; set; }

    [JsonPropertyName("lastHeartbeatOk")]
    public bool LastHeartbeatOk { get; set; }

    [JsonPropertyName("lastError")]
    public string? LastError { get; set; }

    [JsonPropertyName("lastPrintAt")]
    public string? LastPrintAt { get; set; }

    [JsonPropertyName("lastPrintOk")]
    public bool? LastPrintOk { get; set; }

    [JsonPropertyName("pendingAckCount")]
    public int PendingAckCount { get; set; }

    [JsonPropertyName("dashboardUrl")]
    public string DashboardUrl { get; set; } = "";

    [JsonPropertyName("printers")]
    public List<string> Printers { get; set; } = [];
}
