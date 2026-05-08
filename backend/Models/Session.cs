namespace NuclearMentor.API.Models;

public class Session
{
    public int Id { get; set; }
    public string Title { get; set; } = "New Session";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public ICollection<Message> Messages { get; set; } = [];
}
