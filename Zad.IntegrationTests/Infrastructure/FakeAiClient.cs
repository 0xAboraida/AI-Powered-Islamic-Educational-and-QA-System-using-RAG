using Zad.Application.DTOs;
using Zad.Application.Interfaces;
using Zad.Domain.Enums;

namespace Zad.IntegrationTests.Infrastructure;

public sealed class FakeAiClient : IAiClient
{
    public Task<AiResponseDto> AskAsync(AiRequestDto request)
    {
        if (request.Query.Contains("TIMEOUT_TRIGGER", StringComparison.OrdinalIgnoreCase))
        {
            throw new TimeoutException("The AI service request timed out.");
        }

        if (request.Query.Contains("DUPLICATE_CITATION_TRIGGER", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new AiResponseDto
            {
                Answer = "Duplicate citation scenario",
                Citations = new Dictionary<string, AiCitationDto>
                {
                    ["cit_1"] = new AiCitationDto
                    {
                        BookTitle = "Doc 1",
                        Madhhab = "Test",
                        Author = "Test Author",
                        AuthorDeath = "0",
                        TotalParts = 1,
                        Part = "1",
                        PageId = 1,
                        Hierarchy = "Test",
                        SourceUrl = "same-url"
                    },
                    ["cit_2"] = new AiCitationDto
                    {
                        BookTitle = "Doc 1",
                        Madhhab = "Test",
                        Author = "Test Author",
                        AuthorDeath = "0",
                        TotalParts = 1,
                        Part = "1",
                        PageId = 1,
                        Hierarchy = "Test",
                        SourceUrl = "same-url"
                    }
                }
            });
        }

        var answer = request.Domain == (int)SpecializationMode.Language
            ? "This is a simple answer in the language."
            : "This is a detailed expert answer with sources.";

        return Task.FromResult(new AiResponseDto
        {
            Answer = answer,
            Citations = new Dictionary<string, AiCitationDto>
            {
                ["cit_1"] = new AiCitationDto
                {
                    BookTitle = "Quran 112",
                    Madhhab = "General",
                    Author = "Allah",
                    AuthorDeath = "N/A",
                    TotalParts = 1,
                    Part = "1",
                    PageId = 112,
                    Hierarchy = "Surah Al-Ikhlas",
                    SourceUrl = "test-url-1"
                },
                ["cit_2"] = new AiCitationDto
                {
                    BookTitle = "Sahih Bukhari",
                    Madhhab = "Sunni",
                    Author = "Imam Bukhari",
                    AuthorDeath = "256 AH",
                    TotalParts = 1,
                    Part = "1",
                    PageId = 1,
                    Hierarchy = "Hadith Collection",
                    SourceUrl = "test-url-2"
                }
            }
        });
    }
}
