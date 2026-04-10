using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Zad.Application.DTOs;
using Zad.Application.Interfaces;

namespace Zad.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IQuestionService _questionService;

    public ChatController(IChatService chatService, IQuestionService questionService)
    {
        _chatService = chatService;
        _questionService = questionService;
    }

    [HttpPost("sessions")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateSession([FromBody] CreateChatSessionRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId is null)
            {
                return Unauthorized();
            }

            var session = await _chatService.CreateSession(userId.Value, request.Name);
            return CreatedAtAction(nameof(GetSessionById), new { id = session.Id }, session);
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpGet("sessions")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetSessions()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId is null)
            {
                return Unauthorized();
            }

            var sessions = await _chatService.GetUserSessions(userId.Value);
            return Ok(sessions);
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpGet("sessions/{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetSessionById(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId is null)
            {
                return Unauthorized();
            }

            var session = await _chatService.GetSessionDetails(userId.Value, id);
            if (session is null)
            {
                return NotFound(new { message = "Chat session not found." });
            }

            return Ok(session);
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpPost("sessions/{id:int}/messages")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> SendMessage(int id, [FromBody] AskQuestionRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId is null)
            {
                return Unauthorized();
            }

            var result = await _questionService.AskQuestion(userId.Value, id, request.Question, request.ChatMode, request.ExpertSubMode);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private IActionResult HandleException(Exception ex)
    {
        return ex switch
        {
            UnauthorizedAccessException => Unauthorized(new { message = ex.Message }),
            InvalidOperationException when ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase)
                => NotFound(new { message = ex.Message }),
            InvalidOperationException => BadRequest(new { message = ex.Message }),
            ArgumentException => BadRequest(new { message = ex.Message }),
            _ => StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred." })
        };
    }
}
