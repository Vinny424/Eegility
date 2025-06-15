using EegilityApi.Models;

namespace EegilityApi.Services;

public interface IUserService
{
    Task<UserResponseDto?> GetUserByIdAsync(string id);
    Task<UserResponseDto?> GetUserByEmailAsync(string email);
    Task<List<UserResponseDto>> GetAllUsersAsync(int page = 1, int pageSize = 10);
    Task<UserResponseDto> UpdateUserAsync(string id, UserResponseDto updateDto);
    Task<bool> DeleteUserAsync(string id);
    Task<bool> DeactivateUserAsync(string id);
    Task<bool> ActivateUserAsync(string id);
    Task<bool> UpdateUserPermissionsAsync(string id, List<string> permissions);
    Task<bool> ChangePasswordAsync(string id, string currentPassword, string newPassword);
    Task<List<UserResponseDto>> SearchUsersAsync(string searchTerm);
}