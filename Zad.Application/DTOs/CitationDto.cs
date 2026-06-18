namespace Zad.Application.DTOs;

/// <summary>
/// Citation reference attached to an AI answer.
/// </summary>
public class CitationDto
{
    public string BookTitle { get; set; } = string.Empty;
    public string Madhhab { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string AuthorDeath { get; set; } = string.Empty;
    public int TotalParts { get; set; }
    public string Part { get; set; } = string.Empty;
    public int PageId { get; set; }
    public string Hierarchy { get; set; } = string.Empty;
    public string SourceUrl { get; set; } = string.Empty;
}