using Microsoft.AspNetCore.Mvc;
using Zad.Application.DTOs;
using Zad.Application.Interfaces;

namespace Zad.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var user = await _authService.Register(request.Email, request.Password, request.IsChild);
            var token = await _authService.Login(request.Email, request.Password);

            return StatusCode(StatusCodes.Status201Created, new
            {
                token,
                user
            });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var token = await _authService.Login(request.Email, request.Password);
            var user = await _authService.GetByEmail(request.Email);
            if (user is null)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            return Ok(new
            {
                token,
                user
            });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    private IActionResult HandleException(Exception ex)
    {
        return ex switch
        {
            UnauthorizedAccessException => Unauthorized(new { message = ex.Message }),
            InvalidOperationException => BadRequest(new { message = ex.Message }),
            ArgumentException => BadRequest(new { message = ex.Message }),
            _ => StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred." })
        };
    }
}
