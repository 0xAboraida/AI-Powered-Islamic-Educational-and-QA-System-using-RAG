using FluentValidation;
using Zad.Application.DTOs;
using Zad.Domain.Enums;

namespace Zad.Application.Validators;

public class AskQuestionRequestValidator : AbstractValidator<AskQuestionRequest>
{
    public AskQuestionRequestValidator()
    {
        RuleFor(x => x.Question)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(2000);

        RuleFor(x => x.Mode)
            .IsInEnum();
    }
}
