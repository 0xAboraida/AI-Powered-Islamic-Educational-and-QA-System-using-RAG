using AutoMapper;
using AutoMapper;
using FluentValidation;
using Zad.Application.DTOs;
using Zad.Application.Exceptions;
using Zad.Application.Interfaces;
using Zad.Domain.Entities;
using AppValidationException = Zad.Application.Exceptions.ValidationException;

namespace Zad.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJwtTokenProvider _jwtTokenProvider;
    private readonly IValidator<RegisterRequest> _registerRequestValidator;
    private readonly IValidator<LoginRequest> _loginRequestValidator;

    public AuthService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IJwtTokenProvider jwtTokenProvider,
        IValidator<RegisterRequest> registerRequestValidator,
        IValidator<LoginRequest> loginRequestValidator)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _jwtTokenProvider = jwtTokenProvider;
        _registerRequestValidator = registerRequestValidator;
        _loginRequestValidator = loginRequestValidator;
    }

    public async Task<UserDto> Register(string email, string password, bool isChild)
    {
        var registerRequest = new RegisterRequest
        {
            Email = email,
            Password = password,
            IsChild = isChild
        };

        await ValidateAsync(_registerRequestValidator, registerRequest);

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var existingUser = await _unitOfWork.Users.GetByEmailAsync(normalizedEmail);
        if (existingUser is not null)
        {
            throw new AppValidationException([
                new FluentValidation.Results.ValidationFailure(nameof(RegisterRequest.Email), "User already exists.")
            ]);
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
        var loginRequest = new LoginRequest
        {
            Email = email,
            Password = password
        };

        await ValidateAsync(_loginRequestValidator, loginRequest);

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _unitOfWork.Users.GetByEmailAsync(normalizedEmail);
        if (user is null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            throw new UnauthorizedException("Invalid email or password.");
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

    private static async Task ValidateAsync<T>(IValidator<T> validator, T request)
    {
        var validationResult = await validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            throw new AppValidationException(validationResult.Errors);
        }
    }
}
