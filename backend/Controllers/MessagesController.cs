using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NuclearMentor.API.Data;
using NuclearMentor.API.Extensions;
using NuclearMentor.API.Models;
using NuclearMentor.API.Services;

namespace NuclearMentor.API.Controllers;

[ApiController]
[Authorize]
[Route("api/sessions/{sessionId}/messages")]
public class MessagesController(AppDbContext db, IMentorService mentor) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetHistory(int sessionId)
    {
        var userId = User.GetUserId();
        var sessionExists = await db.Sessions
            .AnyAsync(s => s.Id == sessionId && s.UserId == userId);

        if (!sessionExists) return NotFound();

        var messages = await db.Messages
            .Where(m => m.SessionId == sessionId)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new MessageDto(m.Id, m.Role, m.Content, m.CreatedAt))
            .ToListAsync();

        return Ok(messages);
    }

    [HttpPost]
    public async Task SendMessage(int sessionId, [FromBody] SendMessageRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var session = await db.Sessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, ct);

        if (session is null)
        {
            Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        // Save the user message first
        var userMessage = new Message
        {
            SessionId = sessionId,
            Role = "user",
            Content = req.Content,
        };
        db.Messages.Add(userMessage);
        await db.SaveChangesAsync(ct);

        // Load full conversation history (excluding the message just saved)
        var history = await db.Messages
            .Where(m => m.SessionId == sessionId && m.Id != userMessage.Id)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync(ct);

        // Switch to SSE mode
        Response.ContentType = "text/event-stream";
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("X-Accel-Buffering", "no");

        var fullContent = new StringBuilder();

        await foreach (var chunk in mentor.StreamResponseAsync(history, req.Content, ct))
        {
            fullContent.Append(chunk);
            var payload = JsonSerializer.Serialize(chunk);
            await Response.WriteAsync($"data: {payload}\n\n", ct);
            await Response.Body.FlushAsync(ct);
        }

        // Save the complete assistant response
        var assistantMessage = new Message
        {
            SessionId = sessionId,
            Role = "assistant",
            Content = fullContent.ToString(),
        };
        db.Messages.Add(assistantMessage);
        session.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(CancellationToken.None);

        // Signal stream end
        await Response.WriteAsync("event: done\ndata: {}\n\n", ct);
        await Response.Body.FlushAsync(ct);
    }
}

public record MessageDto(int Id, string Role, string Content, DateTime CreatedAt);
public record SendMessageRequest(string Content);
