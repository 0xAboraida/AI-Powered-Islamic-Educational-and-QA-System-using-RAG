using Zad.Domain.Common;

namespace Zad.Domain.Entities;

public class Citation : BaseEntity
{
    public int MessageId { get; set; }

    public string BookTitle { get; set; } = string.Empty;
    public string Madhhab { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string AuthorDeath { get; set; } = string.Empty;
    public int TotalParts { get; set; }
    public string Part { get; set; } = string.Empty;
    public int PageId { get; set; }
    public string Hierarchy { get; set; } = string.Empty;
    public string SourceUrl { get; set; } = string.Empty;

    public Message Message { get; set; } = null!;
}
