using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Zad.Application.DTOs;
using Zad.Application.Interfaces;
using Zad.Domain.Entities;

namespace Zad.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IConfiguration _configuration;

    public AuthService(IUnitOfWork unitOfWork, IMapper mapper, IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _configuration = configuration;
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

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new("is_child", user.IsChild.ToString())
        };

        var key = GetJwtKey();
        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "Zad.API",
            audience: _configuration["Jwt:Audience"] ?? "Zad.Client",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<UserDto?> GetByEmail(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _unitOfWork.Users.GetByEmailAsync(normalizedEmail);
        return user is null ? null : _mapper.Map<UserDto>(user);
    }

    public bool ValidateToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        var tokenHandler = new JwtSecurityTokenHandler();

        try
        {
            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetJwtKey())),
                ValidateIssuer = true,
                ValidIssuer = _configuration["Jwt:Issuer"] ?? "Zad.API",
                ValidateAudience = true,
                ValidAudience = _configuration["Jwt:Audience"] ?? "Zad.Client",
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out _);

            return true;
        }
        catch
        {
            return false;
        }
    }

    private string GetJwtKey()
    {
        return _configuration["Jwt:Key"] ?? "zad-default-jwt-key-change-in-production-123456789";
    }
}
