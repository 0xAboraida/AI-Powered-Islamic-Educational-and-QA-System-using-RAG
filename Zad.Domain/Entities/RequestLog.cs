using Zad.Domain.Common;
using Zad.Domain.Enums;

namespace Zad.Domain.Entities;

public class RequestLog : BaseEntity
{
    public int UserId { get; set; }
    public SpecializationMode Mode { get; set; }
    public RequestStatus Status { get; set; }

    public User User { get; set; } = null!;
}
