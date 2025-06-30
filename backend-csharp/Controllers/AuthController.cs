using EegilityApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MongoDB.Driver;
using MongoDB.Bson;
using BCrypt.Net;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace EegilityApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMongoClient _mongoClient;
    private readonly ILogger<AuthController> _logger;
    private readonly IConfiguration _configuration;

    public AuthController(IMongoClient mongoClient, ILogger<AuthController> logger, IConfiguration configuration)
    {
        _mongoClient = mongoClient;
        _logger = logger;
        _configuration = configuration;
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
            _logger.LogInformation("Login attempt for: {Email}", loginDto.Email);

            var database = _mongoClient.GetDatabase("eeg_database");
            var usersCollection = database.GetCollection<BsonDocument>("users");

            // Find user by email
            var user = await usersCollection.Find(
                Builders<BsonDocument>.Filter.Eq("email", loginDto.Email)
            ).FirstOrDefaultAsync();

            if (user == null)
            {
                _logger.LogWarning("Login failed - user not found: {Email}", loginDto.Email);
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Verify password
            var storedPasswordHash = user["passwordHash"].AsString;
            if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, storedPasswordHash))
            {
                _logger.LogWarning("Login failed - invalid password for: {Email}", loginDto.Email);
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Update last login time
            var updateFilter = Builders<BsonDocument>.Filter.Eq("_id", user["_id"]);
            var update = Builders<BsonDocument>.Update.Set("lastLoginAt", DateTime.UtcNow);
            await usersCollection.UpdateOneAsync(updateFilter, update);

            // Generate JWT token
            var token = GenerateJwtToken(user);

            _logger.LogInformation("Login successful for: {Email}", loginDto.Email);

            var response = new LoginResponseDto
            {
                Token = token,
                User = new UserResponseDto
                {
                    Id = user["_id"].AsObjectId.ToString(),
                    Email = user["email"].AsString,
                    FirstName = user["firstName"].AsString,
                    LastName = user["lastName"].AsString,
                    Role = user.Contains("role") ? (UserRole)user["role"].AsInt32 : UserRole.User,
                    Institution = user.Contains("institution") ? user["institution"].AsString : "",
                    Department = user.Contains("department") ? user["department"].AsString : "",
                    Phone = user.Contains("phone") ? user["phone"].AsString : "",
                    CreatedAt = user["createdAt"].ToUniversalTime(),
                    LastLoginAt = DateTime.UtcNow,
                    IsActive = user["isActive"].AsBoolean
                }
            };

            return Ok(response);
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
            _logger.LogInformation("Registration attempt for: {Email}", registrationDto.Email);

            var database = _mongoClient.GetDatabase("eeg_database");
            var usersCollection = database.GetCollection<BsonDocument>("users");

            // Check if user already exists
            var existingUser = await usersCollection.Find(
                Builders<BsonDocument>.Filter.Eq("email", registrationDto.Email)
            ).FirstOrDefaultAsync();

            if (existingUser != null)
            {
                return BadRequest(new { message = "User with this email already exists" });
            }

            // Create new user
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(registrationDto.Password);
            var newUser = new BsonDocument
            {
                ["_id"] = ObjectId.GenerateNewId(),
                ["email"] = registrationDto.Email,
                ["username"] = registrationDto.Email,
                ["firstName"] = registrationDto.FirstName,
                ["lastName"] = registrationDto.LastName,
                ["passwordHash"] = hashedPassword,
                ["role"] = 0, // UserRole.User enum value
                ["institution"] = registrationDto.Institution ?? "",
                ["department"] = registrationDto.Department ?? "",
                ["phone"] = registrationDto.Phone ?? "",
                ["createdAt"] = DateTime.UtcNow,
                ["updatedAt"] = DateTime.UtcNow,
                ["lastLoginAt"] = (DateTime?)null,
                ["isActive"] = true
            };

            await usersCollection.InsertOneAsync(newUser);

            _logger.LogInformation("User registered successfully: {Email}", registrationDto.Email);

            var response = new UserResponseDto
            {
                Id = newUser["_id"].AsObjectId.ToString(),
                Email = newUser["email"].AsString,
                FirstName = newUser["firstName"].AsString,
                LastName = newUser["lastName"].AsString,
                Role = UserRole.User,
                Institution = newUser["institution"].AsString,
                Department = newUser["department"].AsString,
                Phone = newUser["phone"].AsString,
                CreatedAt = newUser["createdAt"].ToUniversalTime(),
                LastLoginAt = null,
                IsActive = newUser["isActive"].AsBoolean
            };

            return Ok(response);
        }
        catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            _logger.LogWarning("Duplicate email registration attempt: {Email}", registrationDto.Email);
            return BadRequest(new { message = "User with this email already exists" });
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
                Role = user.Contains("role") ? (UserRole)user["role"].AsInt32 : UserRole.User,
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
    public async Task<ActionResult<LoginResponseDto>> RefreshToken([FromBody] RefreshTokenRequest refreshRequest)
    {
        try
        {
            // For now, return a message asking users to login again
            // Refresh token functionality can be implemented later with a proper token store
            _logger.LogInformation("Refresh token request received");
            return Unauthorized(new { message = "Token expired, please login again" });
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

    private string GenerateJwtToken(BsonDocument user)
    {
        var jwtSecret = _configuration["JwtSettings:Secret"];
        if (string.IsNullOrEmpty(jwtSecret))
        {
            _logger.LogError("JWT Secret not configured properly");
            throw new InvalidOperationException("JWT configuration is missing");
        }

        var key = Encoding.ASCII.GetBytes(jwtSecret);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user["_id"].AsObjectId.ToString()),
                new Claim(ClaimTypes.Email, user["email"].AsString),
                new Claim(ClaimTypes.GivenName, user["firstName"].AsString),
                new Claim(ClaimTypes.Surname, user["lastName"].AsString),
                new Claim(ClaimTypes.Role, user.Contains("role") ? ((UserRole)user["role"].AsInt32).ToString() : UserRole.User.ToString())
            }),
            Expires = DateTime.UtcNow.AddHours(24),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public class RefreshTokenRequest
    {
        public string RefreshToken { get; set; } = string.Empty;
    }
}