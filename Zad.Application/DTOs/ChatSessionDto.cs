namespace Zad.Application.DTOs;

/// <summary>
/// Chat session overview information.
/// </summary>
public class ChatSessionDto
{
    /// <summary>
    /// Chat session identifier.
    /// </summary>
    /// <example>45</example>
    public int Id { get; set; }

    /// <summary>
    /// Optional chat session name.
    /// </summary>
    /// <example>Weekly Islamic Study</example>
    public string? Name { get; set; }

    /// <summary>
    /// Session creation timestamp.
    /// </summary>
    /// <example>2026-01-01T10:30:00Z</example>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Number of messages in the session.
    /// </summary>
    /// <example>3</example>
    public int MessageCount { get; set; }
}
