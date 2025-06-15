using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace EegilityApi.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    private readonly IMongoClient _mongoClient;
    private readonly ILogger<HealthController> _logger;

    public HealthController(IMongoClient mongoClient, ILogger<HealthController> logger)
    {
        _mongoClient = mongoClient;
        _logger = logger;
    }

    /// <summary>
    /// Health check endpoint
    /// </summary>
    /// <returns>Health status</returns>
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            var healthChecks = new Dictionary<string, object>
            {
                ["status"] = "healthy",
                ["timestamp"] = DateTime.UtcNow,
                ["version"] = "1.0.0",
                ["environment"] = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown"
            };

            // Check MongoDB connection
            try
            {
                await _mongoClient.ListDatabaseNamesAsync();
                healthChecks["mongodb"] = "connected";
            }
            catch (Exception ex)
            {
                healthChecks["mongodb"] = "disconnected";
                healthChecks["mongodb_error"] = ex.Message;
                healthChecks["status"] = "unhealthy";
            }

            // Check disk space
            try
            {
                var driveInfo = new DriveInfo("/");
                var freeSpaceGB = driveInfo.AvailableFreeSpace / (1024 * 1024 * 1024);
                healthChecks["disk_free_space_gb"] = freeSpaceGB;
                
                if (freeSpaceGB < 1) // Less than 1GB free
                {
                    healthChecks["status"] = "warning";
                    healthChecks["disk_warning"] = "Low disk space";
                }
            }
            catch (Exception ex)
            {
                healthChecks["disk_error"] = ex.Message;
            }

            // Check memory usage
            try
            {
                var workingSet = Environment.WorkingSet;
                var workingSetMB = workingSet / (1024 * 1024);
                healthChecks["memory_usage_mb"] = workingSetMB;
            }
            catch (Exception ex)
            {
                healthChecks["memory_error"] = ex.Message;
            }

            var statusCode = healthChecks["status"].ToString() == "healthy" ? 200 : 503;
            return StatusCode(statusCode, healthChecks);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return StatusCode(503, new
            {
                status = "unhealthy",
                timestamp = DateTime.UtcNow,
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Ready check endpoint
    /// </summary>
    /// <returns>Ready status</returns>
    [HttpGet("ready")]
    public async Task<IActionResult> Ready()
    {
        try
        {
            // Check if MongoDB is accessible
            await _mongoClient.ListDatabaseNamesAsync();
            
            return Ok(new
            {
                status = "ready",
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ready check failed");
            return StatusCode(503, new
            {
                status = "not ready",
                timestamp = DateTime.UtcNow,
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Live check endpoint
    /// </summary>
    /// <returns>Live status</returns>
    [HttpGet("live")]
    public IActionResult Live()
    {
        return Ok(new
        {
            status = "alive",
            timestamp = DateTime.UtcNow
        });
    }
}