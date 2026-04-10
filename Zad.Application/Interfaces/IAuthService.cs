using Zad.Application.DTOs;

namespace Zad.Application.Interfaces;

public interface IAuthService
{
    Task<UserDto> Register(string email, string password, bool isChild);
    Task<string> Login(string email, string password);
    Task<UserDto?> GetByEmail(string email);
    Task<bool> ValidateToken(string token);
}
