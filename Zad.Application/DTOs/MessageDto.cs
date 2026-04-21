namespace Zad.Application.DTOs;

/// <summary>
/// Message exchange between user and AI answer.
/// </summary>
public class MessageDto
{
    /// <summary>
    /// Message identifier.
    /// </summary>
    /// <example>108</example>
    public int Id { get; set; }

    /// <summary>
    /// User question text.
    /// </summary>
    /// <example>What is the meaning of Surah Al-Ikhlas?</example>
    public string Question { get; set; } = string.Empty;

    /// <summary>
    /// AI response text.
    /// </summary>
    /// <example>Surah Al-Ikhlas emphasizes the absolute oneness of Allah.</example>
    public string Answer { get; set; } = string.Empty;

    /// <summary>
    /// Citation references for the answer.
    /// </summary>
    public List<CitationDto> Citations { get; set; } = new();

    /// <summary>
    /// Message creation timestamp.
    /// </summary>
    /// <example>2026-01-01T10:45:00Z</example>
    public DateTime CreatedAt { get; set; }
}
