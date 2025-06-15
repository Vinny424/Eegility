using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MongoDB.Bson;

namespace EegilityApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly IMongoClient _mongoClient;
    private readonly ILogger<TestController> _logger;

    public TestController(IMongoClient mongoClient, ILogger<TestController> logger)
    {
        _mongoClient = mongoClient;
        _logger = logger;
    }

    /// <summary>
    /// Test MongoDB connection without Entity Framework
    /// </summary>
    [HttpGet("mongodb")]
    public async Task<IActionResult> TestMongoDB()
    {
        try
        {
            _logger.LogInformation("Testing MongoDB connection...");
            
            var database = _mongoClient.GetDatabase("eeg_database");
            var collection = database.GetCollection<BsonDocument>("test");
            
            // Try to insert a test document
            var testDoc = new BsonDocument
            {
                ["message"] = "Test connection",
                ["timestamp"] = DateTime.UtcNow,
                ["success"] = true
            };
            
            await collection.InsertOneAsync(testDoc);
            _logger.LogInformation("Successfully inserted test document");
            
            // Try to read it back
            var filter = Builders<BsonDocument>.Filter.Eq("message", "Test connection");
            var result = await collection.Find(filter).FirstOrDefaultAsync();
            
            if (result != null)
            {
                _logger.LogInformation("Successfully retrieved test document");
                await collection.DeleteOneAsync(filter); // Clean up
                
                return Ok(new
                {
                    status = "success",
                    message = "MongoDB connection test successful",
                    database = "eeg_database",
                    timestamp = DateTime.UtcNow,
                    testDocument = result.ToJson()
                });
            }
            else
            {
                return StatusCode(500, new
                {
                    status = "error",
                    message = "Could not retrieve test document",
                    timestamp = DateTime.UtcNow
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "MongoDB test failed: {Message}", ex.Message);
            return StatusCode(500, new
            {
                status = "error",
                message = "MongoDB test failed",
                error = ex.Message,
                type = ex.GetType().Name,
                timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Test endpoint without any database interaction
    /// </summary>
    [HttpGet("simple")]
    public IActionResult SimpleTest()
    {
        return Ok(new
        {
            status = "success",
            message = "Simple test endpoint working",
            timestamp = DateTime.UtcNow,
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
        });
    }

    /// <summary>
    /// Test user collection access
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> TestUsers()
    {
        try
        {
            _logger.LogInformation("Testing users collection access...");
            
            var database = _mongoClient.GetDatabase("eeg_database");
            var usersCollection = database.GetCollection<BsonDocument>("users");
            
            // Try to count documents in users collection
            var count = await usersCollection.CountDocumentsAsync(new BsonDocument());
            
            return Ok(new
            {
                status = "success",
                message = "Users collection accessible",
                userCount = count,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Users collection test failed: {Message}", ex.Message);
            return StatusCode(500, new
            {
                status = "error",
                message = "Users collection test failed",
                error = ex.Message,
                type = ex.GetType().Name,
                timestamp = DateTime.UtcNow
            });
        }
    }
}