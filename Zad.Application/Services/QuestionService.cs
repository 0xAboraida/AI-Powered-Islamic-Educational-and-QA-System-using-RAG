using AutoMapper;
using FluentValidation;
using Microsoft.Extensions.Logging;
using Zad.Application.DTOs;
using Zad.Application.Exceptions;
using Zad.Application.Interfaces;
using Zad.Domain.Entities;
using Zad.Domain.Enums;
using AppValidationException = Zad.Application.Exceptions.ValidationException;

namespace Zad.Application.Services;

public class QuestionService : IQuestionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAiClient _aiClient;
    private readonly IRequestLogService _requestLogService;
    private readonly IMapper _mapper;
    private readonly IValidator<AskQuestionRequest> _askQuestionRequestValidator;
    private readonly ILogger<QuestionService> _logger;

    public QuestionService(
        IUnitOfWork unitOfWork,
        IAiClient aiClient,
        IRequestLogService requestLogService,
        IMapper mapper,
        IValidator<AskQuestionRequest> askQuestionRequestValidator,
        ILogger<QuestionService> logger)
    {
        _unitOfWork = unitOfWork;
        _aiClient = aiClient;
        _requestLogService = requestLogService;
        _mapper = mapper;
        _askQuestionRequestValidator = askQuestionRequestValidator;
        _logger = logger;
    }

    public async Task<MessageDto> AskQuestion(int userId, int chatSessionId, string question, SpecializationMode mode)
    {
        var request = new AskQuestionRequest
        {
            Question = question,
            Mode = mode
        };

        _logger.LogInformation(
            "AskQuestion started for UserId {UserId}, ChatSessionId {ChatSessionId}, Mode {Mode}",
            userId,
            chatSessionId,
            mode);

        var transactionStarted = false;
        try
        {
            var validationResult = await _askQuestionRequestValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                throw new AppValidationException(validationResult.Errors);
            }

            var user = await _unitOfWork.Users.GetByIdAsync(userId)
                ?? throw new NotFoundException("User not found.");

            var chatSession = await _unitOfWork.ChatSessions.GetByIdAsync(chatSessionId)
                ?? throw new NotFoundException("Chat session not found.");

            if (chatSession.UserId != user.Id)
            {
                throw new UnauthorizedException("Chat session does not belong to this user.");
            }

            await _unitOfWork.BeginTransactionAsync();
            transactionStarted = true;

            
            var aiRequest = new AiRequestDto
            {
                SessionId = chatSessionId,
                Query = question,
                Domain = (int)mode
            };

            var aiResponse = await _aiClient.AskAsync(aiRequest);

            var message = new Message
            {
                ChatSessionId = chatSessionId,
                Question = question,
                Answer = aiResponse.Answer
            };

            await _unitOfWork.Messages.AddAsync(message);
            await _unitOfWork.SaveChangesAsync();

            var deduplicatedCitations = (aiResponse.Citations ?? new())
            .Values
            .DistinctBy(citation => (
            citation.BookTitle,
            citation.PageId,
            citation.SourceUrl 
            ))
            .ToList();

            foreach (var citation in deduplicatedCitations)
            {
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
            await _requestLogService.LogRequest(userId, mode, RequestStatus.Success);
            await _unitOfWork.CommitAsync();

            var storedMessage = await _unitOfWork.Messages.GetWithCitationsAsync(message.Id) ?? message;
            _logger.LogInformation(
                "AskQuestion completed for UserId {UserId}, ChatSessionId {ChatSessionId}, MessageId {MessageId}",
                userId,
                chatSessionId,
                message.Id);

            return _mapper.Map<MessageDto>(storedMessage);
        }
        catch (Exception ex)
        {
            if (transactionStarted)
            {
                await _unitOfWork.RollbackAsync();
            }

            await TryLogFailedRequestAsync(userId, mode);

            _logger.LogError(
                ex,
                "AskQuestion failed for UserId {UserId}, ChatSessionId {ChatSessionId}, Mode {Mode}",
                userId,
                chatSessionId,
                mode);

            if (ex is AppException)
            {
                throw;
            }

            throw AppExceptionMapper.ToAppException(ex);
        }
    }

    public async Task<string?> GetAnswer(int messageId)
    {
        var message = await _unitOfWork.Messages.GetByIdAsync(messageId);
        return message?.Answer;
    }

    private async Task TryLogFailedRequestAsync(int userId, SpecializationMode mode)
    {
        try
        {
            var userExists = await _unitOfWork.Users.GetByIdAsync(userId) is not null;
            if (!userExists)
            {
                _logger.LogWarning(
                    "Skipping failed-request log for non-existent UserId {UserId}",
                    userId);
                return;
            }

            await _requestLogService.LogRequest(userId, mode, RequestStatus.Failed);
        }
        catch (Exception logEx)
        {
            _logger.LogWarning(logEx, "Failed to write failed-request log for UserId {UserId}", userId);
        }
    }

    public string BuildPrompt(string question, SpecializationMode mode)
    {
        var modeText = $"Provide a detailed Islamic answer focusing on {mode}.";

        return $"{modeText} Question: {question}.";
    }
}
