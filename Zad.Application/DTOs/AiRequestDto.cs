using System.Text.Json.Serialization;
using Zad.Domain.Enums;

namespace Zad.Application.DTOs;

public class AiRequestDto
{
    [JsonPropertyName("session_id")]
    public int SessionId { get; set; }

    [JsonPropertyName("query")]
    public string Query { get; set; } = string.Empty;

    [JsonPropertyName("domain")]
    public int Domain { get; set; }
}
