namespace NuclearMentor.API.Services;

public interface IMentorService
{
    IAsyncEnumerable<string> StreamResponseAsync(
        IReadOnlyList<NuclearMentor.API.Models.Message> history,
        string userMessage,
        CancellationToken ct = default);
}
