using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MongoDB.Bson;

namespace EegilityApi.Controllers;

[ApiController]
[Route("api/db-maintenance")]
public class DbMaintenanceController : ControllerBase
{
    private readonly IMongoClient _mongoClient;
    private readonly ILogger<DbMaintenanceController> _logger;

    public DbMaintenanceController(IMongoClient mongoClient, ILogger<DbMaintenanceController> logger)
    {
        _mongoClient = mongoClient;
        _logger = logger;
    }

    [HttpPost("cleanup-indexes")]
    public async Task<IActionResult> CleanupIndexes()
    {
        try
        {
            _logger.LogInformation("Starting index cleanup...");
            
            var database = _mongoClient.GetDatabase("eeg_database");
            var usersCollection = database.GetCollection<BsonDocument>("users");

            // Get all current indexes
            var indexes = await usersCollection.Indexes.ListAsync();
            var indexList = await indexes.ToListAsync();

            var result = new List<object>();

            foreach (var index in indexList)
            {
                var indexName = index["name"].AsString;
                _logger.LogInformation("Found index: {IndexName}", indexName);
                
                // Don't drop the default _id index
                if (indexName != "_id_")
                {
                    try
                    {
                        await usersCollection.Indexes.DropOneAsync(indexName);
                        _logger.LogInformation("Dropped index: {IndexName}", indexName);
                        result.Add(new { action = "dropped", index = indexName });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to drop index: {IndexName}", indexName);
                        result.Add(new { action = "failed", index = indexName, error = ex.Message });
                    }
                }
                else
                {
                    result.Add(new { action = "skipped", index = indexName, reason = "system index" });
                }
            }

            // Create a proper email unique index
            try
            {
                var emailIndexKey = Builders<BsonDocument>.IndexKeys.Ascending("email");
                var emailIndexOptions = new CreateIndexOptions { Unique = true };
                await usersCollection.Indexes.CreateOneAsync(new CreateIndexModel<BsonDocument>(emailIndexKey, emailIndexOptions));
                _logger.LogInformation("Created unique email index");
                result.Add(new { action = "created", index = "email_unique" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create email index");
                result.Add(new { action = "failed", index = "email_unique", error = ex.Message });
            }

            return Ok(new
            {
                message = "Index cleanup completed",
                operations = result,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Index cleanup failed: {Error}", ex.Message);
            return StatusCode(500, new
            {
                message = "Index cleanup failed",
                error = ex.Message,
                type = ex.GetType().Name
            });
        }
    }

    [HttpPost("clear-users")]
    public async Task<IActionResult> ClearUsers()
    {
        try
        {
            _logger.LogInformation("Clearing all users...");
            
            var database = _mongoClient.GetDatabase("eeg_database");
            var usersCollection = database.GetCollection<BsonDocument>("users");

            var deleteResult = await usersCollection.DeleteManyAsync(new BsonDocument());
            
            _logger.LogInformation("Deleted {Count} users", deleteResult.DeletedCount);

            return Ok(new
            {
                message = "Users cleared",
                deletedCount = deleteResult.DeletedCount,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Clear users failed: {Error}", ex.Message);
            return StatusCode(500, new
            {
                message = "Clear users failed",
                error = ex.Message,
                type = ex.GetType().Name
            });
        }
    }

    [HttpGet("list-indexes")]
    public async Task<IActionResult> ListIndexes()
    {
        try
        {
            var database = _mongoClient.GetDatabase("eeg_database");
            var usersCollection = database.GetCollection<BsonDocument>("users");

            var indexes = await usersCollection.Indexes.ListAsync();
            var indexList = await indexes.ToListAsync();

            var result = indexList.Select(index => new
            {
                name = index["name"].AsString,
                key = index["key"].ToBsonDocument(),
                unique = index.GetValue("unique", BsonBoolean.False).AsBoolean
            }).ToList();

            return Ok(new
            {
                message = "Indexes listed",
                indexes = result,
                count = result.Count,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "List indexes failed: {Error}", ex.Message);
            return StatusCode(500, new
            {
                message = "List indexes failed",
                error = ex.Message,
                type = ex.GetType().Name
            });
        }
    }
}