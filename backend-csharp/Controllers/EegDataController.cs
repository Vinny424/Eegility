using EegilityApi.Models;
using EegilityApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EegilityApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EegDataController : ControllerBase
{
    private readonly IEegDataService _eegDataService;
    private readonly ILogger<EegDataController> _logger;

    public EegDataController(IEegDataService eegDataService, ILogger<EegDataController> logger)
    {
        _eegDataService = eegDataService;
        _logger = logger;
    }

    /// <summary>
    /// Upload EEG data file
    /// </summary>
    /// <param name="uploadDto">EEG upload data</param>
    /// <returns>Uploaded EEG data information</returns>
    [HttpPost("upload")]
    public async Task<ActionResult<EegDataResponseDto>> UploadEegData([FromForm] EegUploadDto uploadDto)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _eegDataService.UploadEegDataAsync(userId, uploadDto);
            return CreatedAtAction(nameof(GetEegData), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading EEG data");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get user's EEG data with pagination
    /// </summary>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Items per page</param>
    /// <returns>List of EEG data</returns>
    [HttpGet]
    public async Task<ActionResult<List<EegDataResponseDto>>> GetUserEegData(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _eegDataService.GetUserEegDataAsync(userId, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving EEG data");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get specific EEG data by ID
    /// </summary>
    /// <param name="id">EEG data ID</param>
    /// <returns>EEG data information</returns>
    [HttpGet("{id}")]
    public async Task<ActionResult<EegDataResponseDto>> GetEegData(string id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _eegDataService.GetEegDataByIdAsync(id, userId);
            if (result == null)
                return NotFound();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving EEG data {Id}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Update EEG data metadata
    /// </summary>
    /// <param name="id">EEG data ID</param>
    /// <param name="updateDto">Updated EEG data</param>
    /// <returns>Updated EEG data information</returns>
    [HttpPut("{id}")]
    public async Task<ActionResult<EegDataResponseDto>> UpdateEegData(string id, [FromBody] EegDataResponseDto updateDto)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _eegDataService.UpdateEegDataAsync(id, userId, updateDto);
            return Ok(result);
        }
        catch (NotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating EEG data {Id}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Delete EEG data
    /// </summary>
    /// <param name="id">EEG data ID</param>
    /// <returns>Success status</returns>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEegData(string id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _eegDataService.DeleteEegDataAsync(id, userId);
            if (!result)
                return NotFound();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting EEG data {Id}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Download EEG data file
    /// </summary>
    /// <param name="id">EEG data ID</param>
    /// <returns>File stream</returns>
    [HttpGet("{id}/download")]
    public async Task<IActionResult> DownloadEegData(string id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var eegData = await _eegDataService.GetEegDataByIdAsync(id, userId);
            if (eegData == null)
                return NotFound();

            var fileStream = await _eegDataService.DownloadEegDataAsync(id, userId);
            if (fileStream == null)
                return NotFound();

            return File(fileStream, "application/octet-stream", eegData.OriginalFilename);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading EEG data {Id}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Request ADHD analysis for EEG data
    /// </summary>
    /// <param name="requestDto">Analysis request</param>
    /// <returns>Analysis request status</returns>
    [HttpPost("analysis/request")]
    public async Task<IActionResult> RequestAdhdAnalysis([FromBody] AdhdAnalysisRequestDto requestDto)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _eegDataService.RequestAdhdAnalysisAsync(requestDto.EegDataId, userId);
            if (!result)
                return NotFound();

            return Ok(new { message = "ADHD analysis requested successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error requesting ADHD analysis");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get ADHD analysis results
    /// </summary>
    /// <param name="id">EEG data ID</param>
    /// <returns>ADHD analysis results</returns>
    [HttpGet("{id}/analysis")]
    public async Task<ActionResult<AdhdAnalysis>> GetAdhdAnalysis(string id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _eegDataService.GetAdhdAnalysisAsync(id, userId);
            if (result == null)
                return NotFound();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving ADHD analysis for EEG data {Id}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Search EEG data
    /// </summary>
    /// <param name="searchTerm">Search term</param>
    /// <param name="tags">Filter by tags</param>
    /// <param name="format">Filter by format</param>
    /// <returns>Filtered EEG data list</returns>
    [HttpGet("search")]
    public async Task<ActionResult<List<EegDataResponseDto>>> SearchEegData(
        [FromQuery] string? searchTerm,
        [FromQuery] List<string>? tags,
        [FromQuery] EegFormat? format)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _eegDataService.SearchEegDataAsync(userId, searchTerm, tags, format);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching EEG data");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Validate BIDS compliance for EEG data
    /// </summary>
    /// <param name="id">EEG data ID</param>
    /// <returns>BIDS compliance status</returns>
    [HttpGet("{id}/bids/validate")]
    public async Task<IActionResult> ValidateBidsCompliance(string id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Check if user owns this EEG data
            var eegData = await _eegDataService.GetEegDataByIdAsync(id, userId);
            if (eegData == null)
                return NotFound();

            var isCompliant = await _eegDataService.ValidateBidsComplianceAsync(id);
            return Ok(new { bidsCompliant = isCompliant });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating BIDS compliance for EEG data {Id}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}