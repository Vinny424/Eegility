using EegilityApi.Models;
using FluentValidation;

namespace EegilityApi.Validators;

public class UserRegistrationValidator : AbstractValidator<UserRegistrationDto>
{
    public UserRegistrationValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format")
            .MaximumLength(255).WithMessage("Email must be less than 255 characters");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters")
            .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)")
            .WithMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .MaximumLength(100).WithMessage("First name must be less than 100 characters");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .MaximumLength(100).WithMessage("Last name must be less than 100 characters");

        RuleFor(x => x.Institution)
            .MaximumLength(200).WithMessage("Institution must be less than 200 characters");

        RuleFor(x => x.Department)
            .MaximumLength(200).WithMessage("Department must be less than 200 characters");

        RuleFor(x => x.Phone)
            .Matches(@"^[\+]?[1-9][\d]{0,15}$")
            .When(x => !string.IsNullOrEmpty(x.Phone))
            .WithMessage("Invalid phone number format");
    }
}

public class UserLoginValidator : AbstractValidator<UserLoginDto>
{
    public UserLoginValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required");
    }
}

public class EegUploadValidator : AbstractValidator<EegUploadDto>
{
    private readonly string[] _allowedExtensions = { ".edf", ".bdf", ".vhdr", ".set", ".fif", ".cnt", ".npy" };

    public EegUploadValidator()
    {
        RuleFor(x => x.File)
            .NotNull().WithMessage("File is required")
            .Must(file => file != null && file.Length > 0)
            .WithMessage("File cannot be empty")
            .Must(file => file == null || file.Length <= 100 * 1024 * 1024) // 100MB limit
            .WithMessage("File size cannot exceed 100MB")
            .Must(file => file == null || _allowedExtensions.Contains(Path.GetExtension(file.FileName).ToLowerInvariant()))
            .WithMessage($"File must have one of the following extensions: {string.Join(", ", _allowedExtensions)}");

        RuleFor(x => x.SubjectId)
            .NotEmpty().WithMessage("Subject ID is required")
            .MaximumLength(50).WithMessage("Subject ID must be less than 50 characters")
            .Matches(@"^[a-zA-Z0-9]+$").WithMessage("Subject ID must contain only alphanumeric characters");

        RuleFor(x => x.SubjectAge)
            .GreaterThan(0).WithMessage("Subject age must be greater than 0")
            .LessThan(150).WithMessage("Subject age must be less than 150")
            .When(x => x.SubjectAge.HasValue);

        RuleFor(x => x.SubjectGender)
            .Must(gender => string.IsNullOrEmpty(gender) || 
                           new[] { "M", "F", "O", "m", "f", "o", "male", "female", "other" }.Contains(gender))
            .WithMessage("Invalid gender value");

        RuleFor(x => x.Session)
            .MaximumLength(50).WithMessage("Session must be less than 50 characters")
            .Matches(@"^[a-zA-Z0-9]*$")
            .When(x => !string.IsNullOrEmpty(x.Session))
            .WithMessage("Session must contain only alphanumeric characters");

        RuleFor(x => x.Task)
            .MaximumLength(50).WithMessage("Task must be less than 50 characters")
            .Matches(@"^[a-zA-Z0-9]*$")
            .When(x => !string.IsNullOrEmpty(x.Task))
            .WithMessage("Task must contain only alphanumeric characters");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Notes must be less than 1000 characters");
    }
}