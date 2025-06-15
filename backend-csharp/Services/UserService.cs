using AutoMapper;
using EegilityApi.Data;
using EegilityApi.Models;
using Microsoft.EntityFrameworkCore;

namespace EegilityApi.Services;

public class UserService : IUserService
{
    private readonly EegilityDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<UserService> _logger;
    private readonly IAuthService _authService;

    public UserService(
        EegilityDbContext context,
        IMapper mapper,
        ILogger<UserService> logger,
        IAuthService authService)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
        _authService = authService;
    }

    public async Task<UserResponseDto?> GetUserByIdAsync(string id)
    {
        try
        {
            var user = await _context.Users.FindAsync(id);
            return user != null ? _mapper.Map<UserResponseDto>(user) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user by ID: {UserId}", id);
            throw;
        }
    }

    public async Task<UserResponseDto?> GetUserByEmailAsync(string email)
    {
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
            return user != null ? _mapper.Map<UserResponseDto>(user) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user by email: {Email}", email);
            throw;
        }
    }

    public async Task<List<UserResponseDto>> GetAllUsersAsync(int page = 1, int pageSize = 10)
    {
        try
        {
            var skip = (page - 1) * pageSize;
            var users = await _context.Users
                .OrderBy(u => u.CreatedAt)
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();

            return _mapper.Map<List<UserResponseDto>>(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving users list");
            throw;
        }
    }

    public async Task<UserResponseDto> UpdateUserAsync(string id, UserResponseDto updateDto)
    {
        try
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                throw new NotFoundException("User not found");

            // Update allowed fields
            user.FirstName = updateDto.FirstName;
            user.LastName = updateDto.LastName;
            user.Institution = updateDto.Institution;
            user.Department = updateDto.Department;
            user.Phone = updateDto.Phone;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("User updated: {UserId}", id);
            return _mapper.Map<UserResponseDto>(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user: {UserId}", id);
            throw;
        }
    }

    public async Task<bool> DeleteUserAsync(string id)
    {
        try
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return false;

            // Delete associated EEG data
            var eegDataList = await _context.EegData
                .Where(e => e.UserId == id)
                .ToListAsync();

            _context.EegData.RemoveRange(eegDataList);
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User deleted: {UserId}", id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user: {UserId}", id);
            throw;
        }
    }

    public async Task<bool> DeactivateUserAsync(string id)
    {
        try
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return false;

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("User deactivated: {UserId}", id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating user: {UserId}", id);
            throw;
        }
    }

    public async Task<bool> ActivateUserAsync(string id)
    {
        try
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return false;

            user.IsActive = true;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("User activated: {UserId}", id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating user: {UserId}", id);
            throw;
        }
    }

    public async Task<bool> UpdateUserPermissionsAsync(string id, List<string> permissions)
    {
        try
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return false;

            user.Permissions = permissions;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("User permissions updated: {UserId}", id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user permissions: {UserId}", id);
            throw;
        }
    }

    public async Task<bool> ChangePasswordAsync(string id, string currentPassword, string newPassword)
    {
        try
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return false;

            // Verify current password
            if (!_authService.VerifyPassword(currentPassword, user.PasswordHash))
                throw new UnauthorizedAccessException("Current password is incorrect");

            // Update password
            user.PasswordHash = _authService.HashPassword(newPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Password changed for user: {UserId}", id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password for user: {UserId}", id);
            throw;
        }
    }

    public async Task<List<UserResponseDto>> SearchUsersAsync(string searchTerm)
    {
        try
        {
            var users = await _context.Users
                .Where(u => 
                    u.FirstName.Contains(searchTerm) ||
                    u.LastName.Contains(searchTerm) ||
                    u.Email.Contains(searchTerm) ||
                    u.Institution.Contains(searchTerm))
                .OrderBy(u => u.LastName)
                .ThenBy(u => u.FirstName)
                .ToListAsync();

            return _mapper.Map<List<UserResponseDto>>(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching users with term: {SearchTerm}", searchTerm);
            throw;
        }
    }
}