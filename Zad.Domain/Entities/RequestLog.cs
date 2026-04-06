using Zad.Domain.Common;
using Zad.Domain.Enums;

namespace Zad.Domain.Entities;

public class RequestLog : BaseEntity
{
    public int UserId { get; set; }
    public ChatMode Mode { get; set; }
    public ExpertSubMode? ExpertSubMode { get; set; }
    public RequestStatus Status { get; set; }

    public User User { get; set; } = null!;
}
