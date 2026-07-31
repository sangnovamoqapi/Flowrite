using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Flowrite.Models;
using Serilog;

namespace Flowrite.Services;

/// <summary>
/// Generates an AI summary for an essay using any OpenAI-compatible endpoint.
/// Returns null if AI is not configured or the request fails.
/// The app works perfectly fine without this feature.
/// </summary>
public sealed class AiSummaryService
{
    private static readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(60) };

    public bool IsConfigured(AppSettings settings) =>
        !string.IsNullOrWhiteSpace(settings.AiEndpoint) &&
        !string.IsNullOrWhiteSpace(settings.AiModel);

    public async Task<string?> GenerateSummaryAsync(Essay essay, AppSettings settings)
    {
        if (!IsConfigured(settings))
        {
            Log.Warning("AI not configured — skipping summary generation");
            return null;
        }

        var endpoint = settings.AiEndpoint.TrimEnd('/') + "/chat/completions";
        Log.Information("Requesting AI summary from {Endpoint}", endpoint);

        var request = new HttpRequestMessage(HttpMethod.Post, endpoint);

        if (!string.IsNullOrWhiteSpace(settings.AiApiKey))
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", settings.AiApiKey);

        var body = new
        {
            model = settings.AiModel,
            temperature = settings.AiTemperature,
            messages = new[]
            {
                new
                {
                    role = "system",
                    content = "You are a thoughtful editor. Summarize the following writing in 2-3 concise sentences, capturing its core idea and tone. Do not add commentary or suggestions."
                },
                new
                {
                    role = "user",
                    content = essay.Body
                }
            }
        };

        request.Content = new StringContent(
            JsonSerializer.Serialize(body),
            Encoding.UTF8,
            "application/json");

        try
        {
            var response = await _http.SendAsync(request);
            var json = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                Log.Warning("AI request failed: {Status} {Body}", response.StatusCode, json);
                return null;
            }

            using var doc = JsonDocument.Parse(json);
            var summary = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            Log.Information("AI summary received ({Chars} chars)", summary?.Length ?? 0);
            return summary;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "AI summary request threw an exception");
            return null;
        }
    }
}
