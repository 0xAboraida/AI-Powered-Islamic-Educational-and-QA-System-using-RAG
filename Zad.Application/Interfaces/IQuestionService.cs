using Zad.Application.DTOs;
using Zad.Domain.Enums;

namespace Zad.Application.Interfaces;

public interface IQuestionService
{
    Task<MessageDto> AskQuestion(int userId, int chatSessionId, string question, SpecializationMode mode);
    Task<string?> GetAnswer(int messageId);
    string BuildPrompt(string question, SpecializationMode mode);
}
