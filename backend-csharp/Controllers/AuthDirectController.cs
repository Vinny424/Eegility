using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MongoDB.Bson;
using BCrypt.Net;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace EegilityApi.Controllers;

// Temporarily disabled to avoid conflicts with main AuthController
/*
[ApiController]
[Route("api/auth-direct")]
public class AuthDirectController : ControllerBase
{
    private readonly IMongoClient _mongoClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthDirectController> _logger;

    public AuthDirectController(IMongoClient mongoClient, IConfiguration configuration, ILogger<AuthDirectController> logger)
    {
        _mongoClient = mongoClient;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            _logger.LogInformation("Direct registration attempt for: {Email}", request.Email);

            var database = _mongoClient.GetDatabase("eeg_database");
            var usersCollection = database.GetCollection<BsonDocument>("users");

            // Check if user already exists
            var existingUser = await usersCollection.Find(
                Builders<BsonDocument>.Filter.Eq("email", request.Email)
            ).FirstOrDefaultAsync();

            if (existingUser != null)
            {
                return BadRequest(new { message = "User with this email already exists" });
            }

            // Create new user
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);
            var newUser = new BsonDocument
            {
                ["_id"] = ObjectId.GenerateNewId(),
                ["email"] = request.Email,
                ["username"] = request.Email, // Use email as username to satisfy unique constraint
                ["firstName"] = request.FirstName,
                ["lastName"] = request.LastName,
                ["passwordHash"] = hashedPassword,
                ["createdAt"] = DateTime.UtcNow,
                ["updatedAt"] = DateTime.UtcNow,
                ["isActive"] = true
            };

            await usersCollection.InsertOneAsync(newUser);

            _logger.LogInformation("User registered successfully: {Email}", request.Email);

            return Ok(new
            {
                message = "User registered successfully",
                userId = newUser["_id"].AsObjectId.ToString(),
                email = request.Email
            });
        }
        catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            _logger.LogWarning("Duplicate email registration attempt: {Email}", request.Email);
            return BadRequest(new 
            { 
                message = "User with this email already exists",
                field = "email" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration failed for {Email}: {Error}", request.Email, ex.Message);
            return StatusCode(500, new
            {
                message = "Registration failed"
            });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            _logger.LogInformation("Direct login attempt for: {Email}", request.Email);

            var database = _mongoClient.GetDatabase("eeg_database");
            var usersCollection = database.GetCollection<BsonDocument>("users");

            // Find user by email
            var user = await usersCollection.Find(
                Builders<BsonDocument>.Filter.Eq("email", request.Email)
            ).FirstOrDefaultAsync();

            if (user == null)
            {
                _logger.LogWarning("Login failed - user not found: {Email}", request.Email);
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Verify password
            var storedPasswordHash = user["passwordHash"].AsString;
            if (!BCrypt.Net.BCrypt.Verify(request.Password, storedPasswordHash))
            {
                _logger.LogWarning("Login failed - invalid password for: {Email}", request.Email);
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Generate JWT token
            var token = GenerateJwtToken(user);

            _logger.LogInformation("Login successful for: {Email}", request.Email);

            return Ok(new
            {
                message = "Login successful",
                token = token,
                user = new
                {
                    id = user["_id"].AsObjectId.ToString(),
                    email = user["email"].AsString,
                    firstName = user["firstName"].AsString,
                    lastName = user["lastName"].AsString
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login failed for {Email}: {Error}", request.Email, ex.Message);
            return StatusCode(500, new
            {
                message = "Login failed"
            });
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
                new Claim(ClaimTypes.Surname, user["lastName"].AsString)
            }),
            Expires = DateTime.UtcNow.AddHours(24),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
*/