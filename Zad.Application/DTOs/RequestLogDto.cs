using Zad.Domain.Enums;

namespace Zad.Application.DTOs;

public class RequestLogDto
{
    public int Id { get; set; }
    public SpecializationMode Mode { get; set; }
    public RequestStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
