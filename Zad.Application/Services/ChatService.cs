using AutoMapper;
using FluentValidation;
using Microsoft.Extensions.Logging;
using Zad.Application.DTOs;
using Zad.Application.Exceptions;
using Zad.Application.Interfaces;
using Zad.Domain.Entities;
using AppValidationException = Zad.Application.Exceptions.ValidationException;

namespace Zad.Application.Services;

public class ChatService : IChatService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IValidator<CreateChatSessionRequest> _createChatSessionRequestValidator;
    private readonly ILogger<ChatService> _logger;

    public ChatService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IValidator<CreateChatSessionRequest> createChatSessionRequestValidator,
        ILogger<ChatService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _createChatSessionRequestValidator = createChatSessionRequestValidator;
        _logger = logger;
    }

    public async Task<ChatSessionDto> CreateSession(int userId, string? sessionName)
    {
        try
        {
            var normalizedSessionName = string.IsNullOrWhiteSpace(sessionName) ? null : sessionName.Trim();

            var validationResult = await _createChatSessionRequestValidator.ValidateAsync(new CreateChatSessionRequest
            {
                Name = normalizedSessionName
            });

            if (!validationResult.IsValid)
            {
                throw new AppValidationException(validationResult.Errors);
            }

            var user = await _unitOfWork.Users.GetByIdAsync(userId)
                ?? throw new NotFoundException("User not found.");

            var chatSession = new ChatSession
            {
                UserId = user.Id
            };
            chatSession.SetName(normalizedSessionName);

            await _unitOfWork.ChatSessions.AddAsync(chatSession);
            await _unitOfWork.SaveChangesAsync();

            var persistedChatSession = await _unitOfWork.ChatSessions.GetByIdAsync(chatSession.Id) ?? chatSession;

            _logger.LogInformation("Chat session created. UserId: {UserId}, ChatSessionId: {ChatSessionId}", userId, chatSession.Id);

            return _mapper.Map<ChatSessionDto>(persistedChatSession);
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw AppExceptionMapper.ToAppException(ex);
        }
    }

    public async Task<MessageDto> SendMessage(int userId, int chatSessionId, string question, string answer, IReadOnlyDictionary<string, AiCitationDto>? citations = null)
    {
        try
        {
            var chatSession = await _unitOfWork.ChatSessions.GetByIdAsync(chatSessionId)
                ?? throw new NotFoundException("Chat session not found.");

            if (chatSession.UserId != userId)
            {
                _logger.LogWarning("Unauthorized send message attempt. UserId: {UserId}, ChatSessionId: {ChatSessionId}", userId, chatSessionId);
                throw new UnauthorizedException("Chat session does not belong to this user.");
            }

            chatSession.TrySetNameFromQuestion(question);

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
                foreach (var citationEntry in citations)
                {
                    var citation = citationEntry.Value;

                    await _unitOfWork.Citations.AddAsync(new Citation
                    {
                        MessageId = message.Id,
                        BookTitle = citation.BookTitle,
                        Madhhab = citation.Madhhab,
                        Author = citation.Author,
                        AuthorDeath = citation.AuthorDeath,
                        TotalParts = citation.TotalParts,
                        Part = citation.Part,
                        PageId = citation.PageId,
                        Hierarchy = citation.Hierarchy,
                        SourceUrl = citation.SourceUrl
                    });
                }

                await _unitOfWork.SaveChangesAsync();
            }

            var storedMessage = await _unitOfWork.Messages.GetWithCitationsAsync(message.Id) ?? message;
            _logger.LogInformation("Message stored. UserId: {UserId}, ChatSessionId: {ChatSessionId}, MessageId: {MessageId}", userId, chatSessionId, message.Id);
            return _mapper.Map<MessageDto>(storedMessage);
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw AppExceptionMapper.ToAppException(ex);
        }
    }

    public async Task<IReadOnlyList<ChatSessionDto>> GetUserSessionsAsync(int userId)
    {
        var sessions = await _unitOfWork.ChatSessions.GetUserSessionsAsync(userId);
        var messageCountsBySession = await _unitOfWork.Messages.GetMessageCountsBySessionAsync(userId);

        return sessions
            .Select(session => new ChatSessionDto
            {
                Id = session.Id,
                Name = session.Name,
                CreatedAt = session.CreatedAt,
                MessageCount = messageCountsBySession.GetValueOrDefault(session.Id, 0)
            })
            .ToList();
    }

    public async Task<ChatSessionDetailsDto?> GetSessionDetails(int userId, int sessionId)
    {
        try
        {
            var chatSession = await _unitOfWork.ChatSessions.GetWithMessagesAsync(sessionId);
            if (chatSession is null)
            {
                return null;
            }

            if (chatSession.UserId != userId)
            {
                throw new UnauthorizedException("Chat session does not belong to this user.");
            }

            var messages = await _unitOfWork.Messages.GetByChatSessionAsync(sessionId);
            var messageDtos = _mapper.Map<List<MessageDto>>(messages);

            return new ChatSessionDetailsDto
            {
                Session = _mapper.Map<ChatSessionDto>(chatSession),
                Messages = messageDtos
            };
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw AppExceptionMapper.ToAppException(ex);
        }
    }

    public async Task<IReadOnlyList<MessageDto>> GetHistory(int userId)
    {
        var messages = await _unitOfWork.Messages.GetUserMessagesAsync(userId);
        return _mapper.Map<IReadOnlyList<MessageDto>>(messages);
    }

    public async Task<ChatSessionDto?> GetChatSession(int sessionId)
    {
        var chatSession = await _unitOfWork.ChatSessions.GetWithMessagesAsync(sessionId);
        return chatSession is null ? null : _mapper.Map<ChatSessionDto>(chatSession);
    }

    public async Task DeleteSession(int userId, int sessionId)
    {
        try
        {
            var chatSession = await _unitOfWork.ChatSessions.GetByIdAsync(sessionId)
                ?? throw new NotFoundException("Chat session not found.");

            if (chatSession.UserId != userId)
            {
                _logger.LogWarning("Unauthorized delete session attempt. UserId: {UserId}, ChatSessionId: {ChatSessionId}", userId, sessionId);
                throw new UnauthorizedException("Chat session does not belong to this user.");
            }

            await _unitOfWork.ChatSessions.DeleteAsync(sessionId);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Chat session deleted. UserId: {UserId}, ChatSessionId: {ChatSessionId}", userId, sessionId);
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw AppExceptionMapper.ToAppException(ex);
        }
    }

}
