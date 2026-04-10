using AutoMapper;
using AutoMapper;
using FluentValidation;
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

    public QuestionService(
        IUnitOfWork unitOfWork,
        IAiClient aiClient,
        IRequestLogService requestLogService,
        IMapper mapper,
        IValidator<AskQuestionRequest> askQuestionRequestValidator)
    {
        _unitOfWork = unitOfWork;
        _aiClient = aiClient;
        _requestLogService = requestLogService;
        _mapper = mapper;
        _askQuestionRequestValidator = askQuestionRequestValidator;
    }

    public async Task<MessageDto> AskQuestion(int userId, int chatSessionId, string question, ChatMode mode, ExpertSubMode? subMode)
    {
        var request = new AskQuestionRequest
        {
            Question = question,
            ChatMode = mode,
            ExpertSubMode = subMode
        };

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

        try
        {
            var prompt = BuildPrompt(question, mode, null);
            var aiRequest = new AiRequestDto
            {
                Question = prompt,
                Mode = mode,
                SubMode = subMode,
                Context = null
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

            foreach (var citation in aiResponse.Citations)
            {
                await _unitOfWork.Citations.AddAsync(new Citation
                {
                    MessageId = message.Id,
                    DocumentId = citation.DocumentId,
                    ReferenceText = citation.ReferenceText
                });
            }

            await _unitOfWork.SaveChangesAsync();
            await _requestLogService.LogRequest(userId, mode, RequestStatus.Success);
            await _unitOfWork.CommitAsync();

            var storedMessage = await _unitOfWork.Messages.GetWithCitations(message.Id) ?? message;
            return _mapper.Map<MessageDto>(storedMessage);
        }
        catch
        {
            await _requestLogService.LogRequest(userId, mode, RequestStatus.Failed);
            await _unitOfWork.RollbackAsync();
            throw;
        }
    }

    public async Task<string?> GetAnswer(int messageId)
    {
        var message = await _unitOfWork.Messages.GetByIdAsync(messageId);
        return message?.Answer;
    }

    public string BuildPrompt(string question, ChatMode mode, IReadOnlyList<int>? context)
    {
        var modeText = mode == ChatMode.Kids
            ? "Provide a simple, age-appropriate Islamic answer for a child."
            : "Provide a detailed Islamic answer with clear scholarly citations.";

        var contextText = context is not null && context.Count > 0
            ? $" Use these context document IDs: {string.Join(", ", context)}."
            : string.Empty;

        return $"{modeText} Question: {question}.{contextText}";
    }
}
