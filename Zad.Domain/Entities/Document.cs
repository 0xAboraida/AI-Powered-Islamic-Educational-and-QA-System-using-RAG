using Zad.Domain.Common;

namespace Zad.Domain.Entities;

public class Document : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public int CategoryId { get; set; }

    public Category Category { get; set; } = null!;
    public ICollection<Citation> Citations { get; set; } = new List<Citation>();
}
