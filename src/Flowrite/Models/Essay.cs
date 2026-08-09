namespace Flowrite.Models;

public class Essay
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string? Prompt { get; set; }
    public int DurationSeconds { get; set; }
    public int WordCount { get; set; }
    public int CharCount { get; set; }
    public string Body { get; set; } = string.Empty;
    public string? ParentEssayId { get; set; }
    public string? AiSummary { get; set; }

    /// <summary>Estimated reading time in minutes based on 200 wpm average.</summary>
    public double ReadingTimeMinutes => Math.Max(1, WordCount / 200.0);

    /// <summary>Derives a default title from the essay body.</summary>
    public static string DeriveTitle(string body)
    {
        if (string.IsNullOrWhiteSpace(body))
            return "Untitled Essay";

        var firstSentence = body.TrimStart();
        var end = firstSentence.IndexOfAny(['.', '!', '?', '\n']);
        var candidate = end > 0 ? firstSentence[..end] : firstSentence;

        // Truncate to at most 60 chars for a clean title
        return candidate.Length > 60
            ? candidate[..57].TrimEnd() + "…"
            : candidate.Trim();
    }
}
