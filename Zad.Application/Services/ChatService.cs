using AutoMapper;
using Microsoft.Extensions.Logging;
using Zad.Application.DTOs;
using Zad.Application.Exceptions;
using Zad.Application.Interfaces;
using Zad.Domain.Entities;

namespace Zad.Application.Services;

public class ChatService : IChatService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<ChatService> _logger;

    public ChatService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<ChatService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<ChatSessionDto> CreateSession(int userId, string? sessionName)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId)
            ?? throw new NotFoundException("User not found.");

        var chatSession = new ChatSession
        {
            UserId = user.Id
        };

        await _unitOfWork.ChatSessions.AddAsync(chatSession);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Chat session created. UserId: {UserId}, ChatSessionId: {ChatSessionId}", userId, chatSession.Id);

        var dto = _mapper.Map<ChatSessionDto>(chatSession);
        dto.Name = sessionName;
        return dto;
    }

    public async Task<MessageDto> SendMessage(int userId, int chatSessionId, string question, string answer, IReadOnlyList<AiCitationDto>? citations = null)
    {
        var chatSession = await _unitOfWork.ChatSessions.GetByIdAsync(chatSessionId)
            ?? throw new InvalidOperationException("Chat session not found.");

        if (chatSession.UserId != userId)
        {
            _logger.LogWarning("Unauthorized send message attempt. UserId: {UserId}, ChatSessionId: {ChatSessionId}", userId, chatSessionId);
            throw new UnauthorizedAccessException("Chat session does not belong to this user.");
        }

        var message = new Message
        {
            ChatSessionId = chatSessionId,
            Question = question,
            Answer = answer
        };

        await _unitOfWork.Messages.AddAsync(message);
        await _unitOfWork.SaveChangesAsync();

        if (citations is not null && citations.Count > 0)
        {
            foreach (var citation in citations)
            {
                await _unitOfWork.Citations.AddAsync(new Citation
                {
                    MessageId = message.Id,
                    DocumentId = citation.DocumentId,
                    ReferenceText = citation.ReferenceText
                });
            }

            await _unitOfWork.SaveChangesAsync();
        }

        var storedMessage = await _unitOfWork.Messages.GetWithCitations(message.Id) ?? message;
        _logger.LogInformation("Message stored. UserId: {UserId}, ChatSessionId: {ChatSessionId}, MessageId: {MessageId}", userId, chatSessionId, message.Id);
        return _mapper.Map<MessageDto>(storedMessage);
    }

    public async Task<IReadOnlyList<ChatSessionDto>> GetUserSessions(int userId)
    {
        var sessions = await _unitOfWork.ChatSessions.GetUserSessions(userId);
        return _mapper.Map<IReadOnlyList<ChatSessionDto>>(sessions);
    }

    public async Task<ChatSessionDetailsDto?> GetSessionDetails(int userId, int sessionId)
    {
        var chatSession = await _unitOfWork.ChatSessions.GetWithMessages(sessionId);
        if (chatSession is null)
        {
            return null;
        }

        if (chatSession.UserId != userId)
        {
            throw new UnauthorizedAccessException("Chat session does not belong to this user.");
        }

        var messages = await _unitOfWork.Messages.GetByChatSession(sessionId);
        var messageDtos = _mapper.Map<List<MessageDto>>(messages);

        return new ChatSessionDetailsDto
        {
            Session = _mapper.Map<ChatSessionDto>(chatSession),
            Messages = messageDtos
        };
    }

    public async Task<IReadOnlyList<MessageDto>> GetHistory(int userId)
    {
        var sessions = await _unitOfWork.ChatSessions.GetUserSessions(userId);
        var history = new List<Message>();

        foreach (var session in sessions)
        {
            var sessionMessages = await _unitOfWork.Messages.GetByChatSession(session.Id);
            history.AddRange(sessionMessages);
        }

        return _mapper.Map<IReadOnlyList<MessageDto>>(history.OrderBy(x => x.CreatedAt).ToList());
    }

    public async Task<ChatSessionDto?> GetChatSession(int sessionId)
    {
        var chatSession = await _unitOfWork.ChatSessions.GetWithMessages(sessionId);
        return chatSession is null ? null : _mapper.Map<ChatSessionDto>(chatSession);
    }
}
