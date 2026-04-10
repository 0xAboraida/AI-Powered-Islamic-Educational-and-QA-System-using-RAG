namespace Zad.Application.DTOs;

public class ChatSessionDetailsDto
{
    public ChatSessionDto Session { get; set; } = new();
    public List<MessageDto> Messages { get; set; } = new();
}
