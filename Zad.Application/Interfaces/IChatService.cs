using Zad.Application.DTOs;

namespace Zad.Application.Interfaces;

public interface IChatService
{
    Task<ChatSessionDto> CreateSession(int userId, string? sessionName);
    Task<MessageDto> SendMessage(int userId, int chatSessionId, string question, string answer, IReadOnlyDictionary<string, AiCitationDto>? citations = null);
    Task<IReadOnlyList<ChatSessionDto>> GetUserSessionsAsync(int userId);
    Task<ChatSessionDetailsDto?> GetSessionDetails(int userId, int sessionId);
    Task<IReadOnlyList<MessageDto>> GetHistory(int userId);
    Task<ChatSessionDto?> GetChatSession(int sessionId);
    Task DeleteSession(int userId, int sessionId);
}
