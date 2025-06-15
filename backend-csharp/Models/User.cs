using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace EegilityApi.Models;

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public string Role { get; set; } = "User";

    public string Institution { get; set; } = string.Empty;

    public string Department { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;

    public DateTime? LastLoginAt { get; set; }

    public List<string> Permissions { get; set; } = new();

    // Navigation properties
    public virtual ICollection<EegData> EegDataRecords { get; set; } = new List<EegData>();
}

public class UserRegistrationDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;

    public string Institution { get; set; } = string.Empty;

    public string Department { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;
}

public class UserLoginDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class UserResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Institution { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public bool IsActive { get; set; }
}

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserResponseDto User { get; set; } = new();
}