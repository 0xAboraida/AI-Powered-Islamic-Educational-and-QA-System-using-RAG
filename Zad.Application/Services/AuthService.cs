using AutoMapper;
using AutoMapper;
using Zad.Application.DTOs;
using Zad.Application.Interfaces;
using Zad.Domain.Entities;

namespace Zad.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJwtTokenProvider _jwtTokenProvider;

    public AuthService(IUnitOfWork unitOfWork, IMapper mapper, IJwtTokenProvider jwtTokenProvider)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _jwtTokenProvider = jwtTokenProvider;
    }

    public async Task<UserDto> Register(string email, string password, bool isChild)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var existingUser = await _unitOfWork.Users.GetByEmailAsync(normalizedEmail);
        if (existingUser is not null)
        {
            throw new InvalidOperationException("User already exists.");
        }

        var user = new User
        {
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            IsChild = isChild
        };

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<UserDto>(user);
    }

    public async Task<string> Login(string email, string password)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _unitOfWork.Users.GetByEmailAsync(normalizedEmail);
        if (user is null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        return _jwtTokenProvider.GenerateToken(user);
    }

    public async Task<UserDto?> GetByEmail(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _unitOfWork.Users.GetByEmailAsync(normalizedEmail);
        return user is null ? null : _mapper.Map<UserDto>(user);
    }

    public Task<bool> ValidateToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return Task.FromResult(false);
        }

        try
        {
            var principal = _jwtTokenProvider.ValidateToken(token);
            return Task.FromResult(principal.Identity?.IsAuthenticated == true);
        }
        catch
        {
            return Task.FromResult(false);
        }
    }
}
