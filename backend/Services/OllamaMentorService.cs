using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using ChatMessage = NuclearMentor.API.Models.Message;

namespace NuclearMentor.API.Services;

public class OllamaMentorService(IHttpClientFactory httpFactory, IConfiguration config) : IMentorService
{
    private static readonly string SystemPrompt = File.ReadAllText(
        Path.Combine(AppContext.BaseDirectory, "Services", "SystemPrompt.txt"));

    public async IAsyncEnumerable<string> StreamResponseAsync(
        IReadOnlyList<ChatMessage> history,
        string userMessage,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        var baseUrl = config["AI:Ollama:BaseUrl"] ?? "http://localhost:11434";
        var model   = config["AI:Ollama:Model"]   ?? "llama3.2";
        var think   = config.GetValue<bool>("AI:Ollama:Think"); // false by default

        var messages = new List<object>
        {
            new { role = "system", content = SystemPrompt }
        };
        foreach (var m in history)
            messages.Add(new { role = m.Role, content = m.Content });
        messages.Add(new { role = "user", content = userMessage });

        var payload = new
        {
            model,
            messages,
            stream  = true,
            options = new { think }
        };

        var http    = httpFactory.CreateClient("ollama");
        var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/api/chat")
        {
            Content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json")
        };

        using var response = await http.SendAsync(
            request, HttpCompletionOption.ResponseHeadersRead, ct);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        using var reader       = new StreamReader(stream);

        while (!reader.EndOfStream && !ct.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync(ct);
            if (string.IsNullOrWhiteSpace(line)) continue;

            JsonDocument doc;
            try { doc = JsonDocument.Parse(line); }
            catch (JsonException) { continue; }

            using (doc)
            {
                var root = doc.RootElement;

                if (root.TryGetProperty("message", out var msg))
                {
                    // Regular response content
                    if (msg.TryGetProperty("content", out var content))
                    {
                        var text = content.GetString();
                        if (!string.IsNullOrEmpty(text))
                            yield return text;
                    }

                    // Thinking content (Qwen3 / deepseek-r1 etc.) — stream when enabled
                    if (think && msg.TryGetProperty("thinking", out var thinking))
                    {
                        var thoughtText = thinking.GetString();
                        if (!string.IsNullOrEmpty(thoughtText))
                            yield return thoughtText;
                    }
                }

                if (root.TryGetProperty("done", out var done) && done.GetBoolean())
                    yield break;
            }
        }
    }
}
