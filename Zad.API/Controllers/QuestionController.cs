using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Zad.Application.DTOs;
using Zad.Application.Interfaces;

namespace Zad.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class QuestionController : ControllerBase
{
    private readonly IQuestionService _questionService;
    private readonly IChatService _chatService;

    public QuestionController(IQuestionService questionService, IChatService chatService)
    {
        _questionService = questionService;
        _chatService = chatService;
    }

    [HttpPost("ask")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Ask([FromBody] AskQuestionRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var session = await _chatService.CreateSession(userId.Value, null);
        var result = await _questionService.AskQuestion(userId.Value, session.Id, request.Question, request.ChatMode, request.ExpertSubMode);

        return Ok(result);
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
