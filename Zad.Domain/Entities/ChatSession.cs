using Zad.Domain.Common;

namespace Zad.Domain.Entities;

public class ChatSession : BaseEntity
{
    public int UserId { get; set; }

    public User User { get; set; } = null!;
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
