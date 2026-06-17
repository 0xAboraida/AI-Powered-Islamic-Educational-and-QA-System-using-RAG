using Zad.Domain.Enums;

namespace Zad.Application.Interfaces;

public interface IRequestLogService
{
    Task LogRequest(int userId, SpecializationMode mode, RequestStatus status);
}
