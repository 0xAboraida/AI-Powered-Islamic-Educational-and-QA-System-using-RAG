namespace Zad.Application.DTOs;

using System.Text.Json.Serialization;

public class AiResponseDto
{
    [JsonPropertyName("answer")]
    public string Answer { get; set; } = string.Empty;

    [JsonPropertyName("citations")]
    public Dictionary<string, AiCitationDto> Citations { get; set; } = new();
}
