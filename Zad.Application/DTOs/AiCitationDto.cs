using System.Text.Json.Serialization;

namespace Zad.Application.DTOs;

public class AiCitationDto
{
    [JsonPropertyName("book_title")]
    public string BookTitle { get; set; } = string.Empty;

    [JsonPropertyName("madhhab")]
    public string Madhhab { get; set; } = string.Empty;

    [JsonPropertyName("author")]
    public string Author { get; set; } = string.Empty;

    [JsonPropertyName("author_death")]
    public string AuthorDeath { get; set; } = string.Empty;

    [JsonPropertyName("total_parts")]
    public int TotalParts { get; set; }

    [JsonPropertyName("part")]
    public string Part { get; set; } = string.Empty;

    [JsonPropertyName("page_id")]
    public int PageId { get; set; }

    [JsonPropertyName("hierarchy")]
    public string Hierarchy { get; set; } = string.Empty;

    [JsonPropertyName("source_url")]
    public string SourceUrl { get; set; } = string.Empty;
}
