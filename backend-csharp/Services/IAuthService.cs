using EegilityApi.Models;

namespace EegilityApi.Services;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(UserLoginDto loginDto);
    Task<UserResponseDto> RegisterAsync(UserRegistrationDto registrationDto);
    Task<string> GenerateJwtTokenAsync(User user);
    Task<string> GenerateRefreshTokenAsync();
    Task<bool> ValidateRefreshTokenAsync(string refreshToken);
    Task<User?> GetUserByEmailAsync(string email);
    Task<User?> GetUserByIdAsync(string id);
    bool VerifyPassword(string password, string hashedPassword);
    string HashPassword(string password);
}