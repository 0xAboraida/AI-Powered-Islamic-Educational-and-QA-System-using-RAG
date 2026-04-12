using AutoMapper;
using FluentValidation;
using Microsoft.Extensions.Logging;
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
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IJwtTokenProvider jwtTokenProvider,
        IValidator<RegisterRequest> registerRequestValidator,
        IValidator<LoginRequest> loginRequestValidator,
        ILogger<AuthService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _jwtTokenProvider = jwtTokenProvider;
        _registerRequestValidator = registerRequestValidator;
        _loginRequestValidator = loginRequestValidator;
        _logger = logger;
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
            _logger.LogWarning("Register failed because user already exists. Email: {Email}", normalizedEmail);
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

        _logger.LogInformation("User registered successfully. UserId: {UserId}", user.Id);

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
            _logger.LogWarning("Login failed for Email: {Email}", normalizedEmail);
            throw new UnauthorizedException("Invalid email or password.");
        }

        var userWithRoles = await _unitOfWork.Users.GetByIdWithRolesAsync(user.Id);
        if (userWithRoles is null)
        {
            _logger.LogWarning("Login failed while loading roles for UserId: {UserId}", user.Id);
            throw new UnauthorizedException("Invalid email or password.");
        }

        _logger.LogInformation("Login successful for UserId: {UserId}", userWithRoles.Id);

        return _jwtTokenProvider.GenerateToken(userWithRoles);
    }

    public async Task<UserDto?> GetByEmail(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _unitOfWork.Users.GetByEmailAsync(normalizedEmail);
        return user is null ? null : _mapper.Map<UserDto>(user);
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
