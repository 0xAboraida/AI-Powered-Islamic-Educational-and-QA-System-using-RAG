using System.Security.Claims;
using Zad.Domain.Entities;

namespace Zad.Application.Interfaces;

public interface IJwtTokenProvider
{
    string GenerateToken(User user);
    ClaimsPrincipal ValidateToken(string token);
}
