using Zad.Domain.Common;

namespace Zad.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsChild { get; set; }

    public ICollection<Role> Roles { get; set; } = new List<Role>();
    public ICollection<ChatSession> ChatSessions { get; set; } = new List<ChatSession>();
    public ICollection<RequestLog> RequestLogs { get; set; } = new List<RequestLog>();
}
