using EegilityApi.Models;
using EegilityApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EegilityApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UserController> _logger;

    public UserController(IUserService userService, ILogger<UserController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Get current user information
    /// </summary>
    /// <returns>Current user information</returns>
    [HttpGet("me")]
    public async Task<ActionResult<UserResponseDto>> GetCurrentUser()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
                return NotFound();

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Update current user information
    /// </summary>
    /// <param name="updateDto">Updated user information</param>
    /// <returns>Updated user information</returns>
    [HttpPut("me")]
    public async Task<ActionResult<UserResponseDto>> UpdateCurrentUser([FromBody] UserResponseDto updateDto)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _userService.UpdateUserAsync(userId, updateDto);
            return Ok(result);
        }
        catch (NotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating current user");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Change current user password
    /// </summary>
    /// <param name="changePasswordDto">Password change request</param>
    /// <returns>Success status</returns>
    [HttpPost("me/change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _userService.ChangePasswordAsync(userId, 
                changePasswordDto.CurrentPassword, changePasswordDto.NewPassword);
            
            if (!result)
                return BadRequest(new { message = "Failed to change password" });

            return Ok(new { message = "Password changed successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get all users (Admin only)
    /// </summary>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Items per page</param>
    /// <returns>List of users</returns>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<UserResponseDto>>> GetAllUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var users = await _userService.GetAllUsersAsync(page, pageSize);
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all users");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get user by ID (Admin only)
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>User information</returns>
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserResponseDto>> GetUserById(string id)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
                return NotFound();

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by ID: {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Search users (Admin only)
    /// </summary>
    /// <param name="searchTerm">Search term</param>
    /// <returns>List of matching users</returns>
    [HttpGet("search")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<UserResponseDto>>> SearchUsers([FromQuery] string searchTerm)
    {
        try
        {
            var users = await _userService.SearchUsersAsync(searchTerm);
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching users with term: {SearchTerm}", searchTerm);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Update user permissions (Admin only)
    /// </summary>
    /// <param name="id">User ID</param>
    /// <param name="permissionsDto">Permissions update request</param>
    /// <returns>Success status</returns>
    [HttpPut("{id}/permissions")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUserPermissions(string id, [FromBody] UpdatePermissionsDto permissionsDto)
    {
        try
        {
            var result = await _userService.UpdateUserPermissionsAsync(id, permissionsDto.Permissions);
            if (!result)
                return NotFound();

            return Ok(new { message = "Permissions updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating permissions for user: {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Deactivate user (Admin only)
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>Success status</returns>
    [HttpPost("{id}/deactivate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeactivateUser(string id)
    {
        try
        {
            var result = await _userService.DeactivateUserAsync(id);
            if (!result)
                return NotFound();

            return Ok(new { message = "User deactivated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating user: {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Activate user (Admin only)
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>Success status</returns>
    [HttpPost("{id}/activate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ActivateUser(string id)
    {
        try
        {
            var result = await _userService.ActivateUserAsync(id);
            if (!result)
                return NotFound();

            return Ok(new { message = "User activated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating user: {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Delete user (Admin only)
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>Success status</returns>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        try
        {
            var result = await _userService.DeleteUserAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user: {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class UpdatePermissionsDto
{
    public List<string> Permissions { get; set; } = new();
}