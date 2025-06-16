using EegilityApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MongoDB.Driver;
using MongoDB.Bson;

namespace EegilityApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMongoClient _mongoClient;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IMongoClient mongoClient, ILogger<AuthController> logger)
    {
        _mongoClient = mongoClient;
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
            // Redirect to AuthDirectController for now
            return BadRequest(new { message = "Please use /api/auth-direct/login endpoint" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login error for email: {Email}", loginDto.Email);
            return StatusCode(500, new { message = "Internal server error during login" });
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
            // Redirect to AuthDirectController for now
            return BadRequest(new { message = "Please use /api/auth-direct/register endpoint" });
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

            var database = _mongoClient.GetDatabase("eeg_database");
            var usersCollection = database.GetCollection<BsonDocument>("users");
            
            var filter = Builders<BsonDocument>.Filter.Eq("_id", ObjectId.Parse(userId));
            var user = await usersCollection.Find(filter).FirstOrDefaultAsync();
            
            if (user == null)
                return NotFound();

            return Ok(new UserResponseDto
            {
                Id = user["_id"].AsObjectId.ToString(),
                Email = user["email"].AsString,
                FirstName = user["firstName"].AsString,
                LastName = user["lastName"].AsString,
                Role = user.Contains("role") ? user["role"].AsString : "User",
                Institution = user.Contains("institution") ? user["institution"].AsString : "",
                Department = user.Contains("department") ? user["department"].AsString : "",
                Phone = user.Contains("phone") ? user["phone"].AsString : "",
                CreatedAt = user["createdAt"].ToUniversalTime(),
                LastLoginAt = user.Contains("lastLoginAt") ? user["lastLoginAt"].ToUniversalTime() : (DateTime?)null,
                IsActive = user["isActive"].AsBoolean
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
            // Refresh token functionality disabled - redirect to auth-direct
            return BadRequest(new { message = "Refresh token not implemented, please login again" });
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