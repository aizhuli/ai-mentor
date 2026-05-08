namespace NuclearMentor.API.Models;

public class Message
{
    public int Id { get; set; }
    public string Role { get; set; } = string.Empty;  // "user" or "assistant"
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int SessionId { get; set; }
    public Session Session { get; set; } = null!;
}
