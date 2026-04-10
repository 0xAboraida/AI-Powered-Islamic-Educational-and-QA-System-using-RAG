using Zad.Application.DTOs;
using Zad.Application.Interfaces;
using Zad.Domain.Enums;

namespace Zad.IntegrationTests.Infrastructure;

public sealed class FakeAiClient : IAiClient
{
    public Task<AiResponseDto> AskAsync(AiRequestDto request)
    {
        if (request.Question.Contains("TIMEOUT_TRIGGER", StringComparison.OrdinalIgnoreCase))
        {
            throw new TimeoutException("The AI service request timed out.");
        }

        if (request.Question.Contains("DUPLICATE_CITATION_TRIGGER", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new AiResponseDto
            {
                Answer = "Duplicate citation scenario",
                Citations =
                [
                    new AiCitationDto { DocumentId = 1, ReferenceText = "Same reference" },
                    new AiCitationDto { DocumentId = 1, ReferenceText = "Same reference" }
                ]
            });
        }

        var answer = request.Mode == ChatMode.Kids
            ? "??? ???? ???? ??????? ?? ???? ????."
            : "This is a detailed expert answer with sources.";

        return Task.FromResult(new AiResponseDto
        {
            Answer = answer,
            Citations =
            [
                new AiCitationDto { DocumentId = 1, ReferenceText = "Quran 112:1-4" },
                new AiCitationDto { DocumentId = 2, ReferenceText = "Sahih al-Bukhari 1" }
            ]
        });
    }
}
