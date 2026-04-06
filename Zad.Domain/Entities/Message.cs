using Zad.Domain.Common;

namespace Zad.Domain.Entities;

public class Message : BaseEntity
{
    public int ChatSessionId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;

    public ChatSession ChatSession { get; set; } = null!;
    public ICollection<Citation> Citations { get; set; } = new List<Citation>();
}
