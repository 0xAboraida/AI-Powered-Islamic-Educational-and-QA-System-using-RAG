using Zad.Domain.Enums;

namespace Zad.Application.DTOs;

/// <summary>
/// Request payload for asking a question to the AI service.
/// </summary>
public class AskQuestionRequest
{
    /// <summary>
    /// The user question text.
    /// </summary>
    /// <example>What is the ruling on zakat for gold savings?</example>
    public string Question { get; set; } = string.Empty;

    /// <summary>
    /// Specialization mode for the topic.
    /// </summary>
    /// <example>1</example>
    public SpecializationMode Mode { get; set; }
}
