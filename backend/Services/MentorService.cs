using System.Runtime.CompilerServices;
using Anthropic;
using Anthropic.Models.Messages;
using ChatMessage = NuclearMentor.API.Models.Message;

namespace NuclearMentor.API.Services;

public class MentorService(IAnthropicClient anthropic) : IMentorService
{
    private static readonly string SystemPrompt = File.ReadAllText(
        Path.Combine(AppContext.BaseDirectory, "Services", "SystemPrompt.txt"));

    public async IAsyncEnumerable<string> StreamResponseAsync(
        IReadOnlyList<ChatMessage> history,
        string userMessage,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        var messages = history
            .Select(m => new MessageParam { Role = m.Role, Content = m.Content })
            .Append(new MessageParam { Role = "user", Content = userMessage })
            .ToList();

        var stream = anthropic.Messages.CreateStreaming(new MessageCreateParams
        {
            Model = "claude-opus-4-7",
            MaxTokens = 8192,
            System = SystemPrompt,
            Messages = messages,
        }, ct);

        await foreach (var streamEvent in stream.WithCancellation(ct))
        {
            if (streamEvent.TryPickContentBlockDelta(out var deltaEvent) &&
                deltaEvent.Delta.TryPickText(out var textDelta))
            {
                yield return textDelta.Text;
            }
        }
    }
}
