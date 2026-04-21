namespace Zad.Application.DTOs;

/// <summary>
/// Knowledge base document metadata.
/// </summary>
public class DocumentDto
{
    /// <summary>
    /// Document identifier.
    /// </summary>
    /// <example>9</example>
    public int Id { get; set; }

    /// <summary>
    /// Document title.
    /// </summary>
    /// <example>Riyad as-Salihin - Book of Knowledge</example>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Document source collection.
    /// </summary>
    /// <example>Riyad as-Salihin</example>
    public string Source { get; set; } = string.Empty;

    /// <summary>
    /// Category name associated with the document.
    /// </summary>
    /// <example>Hadith</example>
    public string CategoryName { get; set; } = string.Empty;
}
