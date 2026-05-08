using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NuclearMentor.API.Data;
using NuclearMentor.API.Extensions;
using NuclearMentor.API.Models;

namespace NuclearMentor.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class SessionsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var userId = User.GetUserId();
        var sessions = await db.Sessions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.UpdatedAt)
            .Select(s => new SessionDto(s.Id, s.Title, s.CreatedAt, s.UpdatedAt))
            .ToListAsync();

        return Ok(sessions);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateSessionRequest req)
    {
        var userId = User.GetUserId();
        var session = new Session
        {
            Title = string.IsNullOrWhiteSpace(req.Title) ? "New Session" : req.Title,
            UserId = userId,
        };

        db.Sessions.Add(session);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(List), new SessionDto(session.Id, session.Title, session.CreatedAt, session.UpdatedAt));
    }

    [HttpPatch("{id}/title")]
    public async Task<IActionResult> Rename(int id, RenameSessionRequest req)
    {
        var userId = User.GetUserId();
        var session = await db.Sessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (session is null) return NotFound();

        session.Title = req.Title;
        session.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new SessionDto(session.Id, session.Title, session.CreatedAt, session.UpdatedAt));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.GetUserId();
        var session = await db.Sessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (session is null) return NotFound();

        db.Sessions.Remove(session);
        await db.SaveChangesAsync();

        return NoContent();
    }
}

public record SessionDto(int Id, string Title, DateTime CreatedAt, DateTime UpdatedAt);
public record CreateSessionRequest(string? Title);
public record RenameSessionRequest(string Title);
