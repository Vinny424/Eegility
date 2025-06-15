using EegilityApi.Models;
using EegilityApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EegilityApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// User login
    /// </summary>
    /// <param name="loginDto">Login credentials</param>
    /// <returns>JWT token and user information</returns>
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] UserLoginDto loginDto)
    {
        try
        {
            var result = await _authService.LoginAsync(loginDto);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login error for email: {Email}", loginDto.Email);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// User registration
    /// </summary>
    /// <param name="registrationDto">User registration information</param>
    /// <returns>Created user information</returns>
    [HttpPost("register")]
    public async Task<ActionResult<UserResponseDto>> Register([FromBody] UserRegistrationDto registrationDto)
    {
        try
        {
            var result = await _authService.RegisterAsync(registrationDto);
            return CreatedAtAction(nameof(GetProfile), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration error for email: {Email}", registrationDto.Email);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get current user profile
    /// </summary>
    /// <returns>Current user information</returns>
    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<UserResponseDto>> GetProfile()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null)
                return NotFound();

            return Ok(new UserResponseDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role,
                Institution = user.Institution,
                Department = user.Department,
                Phone = user.Phone,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                IsActive = user.IsActive
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting profile");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Refresh JWT token
    /// </summary>
    /// <param name="refreshToken">Refresh token</param>
    /// <returns>New JWT token</returns>
    [HttpPost("refresh")]
    public async Task<ActionResult<LoginResponseDto>> RefreshToken([FromBody] string refreshToken)
    {
        try
        {
            var isValid = await _authService.ValidateRefreshTokenAsync(refreshToken);
            if (!isValid)
                return Unauthorized(new { message = "Invalid refresh token" });

            // For now, return unauthorized as refresh token implementation needs more work
            return Unauthorized(new { message = "Refresh token validation not fully implemented" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing token");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Logout user (invalidate token)
    /// </summary>
    /// <returns>Success message</returns>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        try
        {
            // In a production environment, you would add the token to a blacklist
            // For now, we'll just return success
            return Ok(new { message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Validate JWT token
    /// </summary>
    /// <returns>Token validation result</returns>
    [HttpGet("validate")]
    [Authorize]
    public async Task<IActionResult> ValidateToken()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            
            return Ok(new 
            { 
                valid = true, 
                userId = userId,
                email = email,
                message = "Token is valid" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating token");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}