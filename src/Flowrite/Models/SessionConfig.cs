namespace Flowrite.Models;

public class SessionConfig
{
    public int DurationSeconds { get; set; } = 600;
    public int MinWordCount { get; set; } = 300;
    public int IdleTimeoutSeconds { get; set; } = 5;
    public string? Prompt { get; set; }
    public string? ParentEssayId { get; set; }
}
