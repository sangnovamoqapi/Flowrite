namespace Flowrite.Models;

public class AppSettings
{
    public int Id { get; set; } = 1;
    public string Theme { get; set; } = "Dark";
    public int FontSize { get; set; } = 18;
    public int DefaultDurationSeconds { get; set; } = 600;   // 10 minutes
    public int DefaultMinWordCount { get; set; } = 300;
    public int DefaultIdleTimeoutSeconds { get; set; } = 5;
    public string StorageDirectory { get; set; } = string.Empty;
    public string AiEndpoint { get; set; } = string.Empty;
    public string AiApiKey { get; set; } = string.Empty;
    public string AiModel { get; set; } = string.Empty;
    public double AiTemperature { get; set; } = 0.7;
    public int PasteAbuseThresholdWords { get; set; } = 50;
}
