using Flowrite.Models;
using Serilog;

namespace Flowrite.Services;

/// <summary>
/// Exports an essay to a Markdown file.
/// </summary>
public sealed class ExportService
{
    public async Task ExportToMarkdownAsync(Essay essay, string filePath)
    {
        Log.Information("Exporting essay {Id} to {Path}", essay.Id, filePath);
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"# {essay.Title}");
        sb.AppendLine();
        sb.AppendLine($"*Written on {essay.Date:MMMM d, yyyy} · {essay.WordCount} words · {essay.DurationSeconds / 60} min session*");
        sb.AppendLine();

        if (!string.IsNullOrWhiteSpace(essay.Prompt))
        {
            sb.AppendLine($"> **Prompt:** {essay.Prompt}");
            sb.AppendLine();
        }

        sb.AppendLine("---");
        sb.AppendLine();
        sb.AppendLine(essay.Body);

        if (!string.IsNullOrWhiteSpace(essay.AiSummary))
        {
            sb.AppendLine();
            sb.AppendLine("---");
            sb.AppendLine();
            sb.AppendLine("## AI Summary");
            sb.AppendLine();
            sb.AppendLine(essay.AiSummary);
        }

        await File.WriteAllTextAsync(filePath, sb.ToString());
        Log.Information("Export complete");
    }
}
