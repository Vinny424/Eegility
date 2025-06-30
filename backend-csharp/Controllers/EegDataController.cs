using EegilityApi.Models;
using EegilityApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MongoDB.Driver;

namespace EegilityApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EegDataController : ControllerBase
{
    private readonly IEegDataService _eegDataService;
    private readonly IDataSharingService _dataSharingService;
    private readonly IMongoCollection<User> _userCollection;
    private readonly ILogger<EegDataController> _logger;

    public EegDataController(
        IEegDataService eegDataService, 
        IDataSharingService dataSharingService,
        IMongoDatabase database,
        ILogger<EegDataController> logger)
    {
        _eegDataService = eegDataService;
        _dataSharingService = dataSharingService;
        _userCollection = database.GetCollection<User>("users");
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
    /// Get specific EEG data by ID (supports RBAC sharing)
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

            // Check if user has access to this EEG data
            var hasAccess = await _dataSharingService.CanUserAccessEegDataAsync(id, userId);
            if (!hasAccess)
                return Forbid("Access denied to this EEG data");

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
    /// Get all accessible EEG data for Data Browser (includes own + shared + department/admin access)
    /// </summary>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Items per page</param>
    /// <param name="searchTerm">Search term</param>
    /// <param name="filterByOwner">Filter by data ownership</param>
    /// <returns>List of accessible EEG data with access information</returns>
    [HttpGet("browse")]
    public async Task<ActionResult<DataBrowserResponseDto>> BrowseAccessibleEegData(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? searchTerm = null,
        [FromQuery] DataOwnershipFilter filterByOwner = DataOwnershipFilter.All)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var currentUser = await _userCollection.Find(x => x.Id == userId).FirstOrDefaultAsync();
            if (currentUser == null)
                return Unauthorized();

            // Get accessible EEG data IDs based on RBAC
            var accessibleIds = await _dataSharingService.GetAccessibleEegDataIdsAsync(userId);
            
            // Get the actual EEG data with pagination
            var allAccessibleData = await _eegDataService.GetEegDataByIdsAsync(accessibleIds);
            
            // Apply filtering
            var filteredData = allAccessibleData.AsQueryable();
            
            if (!string.IsNullOrEmpty(searchTerm))
            {
                filteredData = filteredData.Where(x => 
                    x.OriginalFilename.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                    x.Notes.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                    x.Tags.Any(t => t.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)));
            }

            if (filterByOwner != DataOwnershipFilter.All)
            {
                switch (filterByOwner)
                {
                    case DataOwnershipFilter.OwnData:
                        filteredData = filteredData.Where(x => x.UserId == userId);
                        break;
                    case DataOwnershipFilter.SharedWithMe:
                        filteredData = filteredData.Where(x => x.UserId != userId);
                        break;
                }
            }

            var totalCount = filteredData.Count();
            var pagedData = filteredData
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            // Enhance data with access information
            var enhancedData = new List<EegDataWithAccessInfoDto>();
            foreach (var eegData in pagedData)
            {
                var permission = await _dataSharingService.GetUserPermissionForEegDataAsync(eegData.Id, userId);
                var isOwner = eegData.UserId == userId;
                var ownerInfo = await _userCollection.Find(x => x.Id == eegData.UserId).FirstOrDefaultAsync();

                enhancedData.Add(new EegDataWithAccessInfoDto
                {
                    EegData = eegData,
                    IsOwner = isOwner,
                    AccessType = GetAccessType(currentUser, eegData, isOwner),
                    Permission = permission ?? SharingPermission.ViewOnly,
                    OwnerName = $"{ownerInfo?.FirstName} {ownerInfo?.LastName}",
                    OwnerEmail = ownerInfo?.Email ?? "Unknown",
                    OwnerInstitution = ownerInfo?.Institution ?? ""
                });
            }

            var response = new DataBrowserResponseDto
            {
                Data = enhancedData,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize),
                UserRole = currentUser.Role,
                CanViewAll = currentUser.Role == UserRole.Admin || currentUser.Role == UserRole.DepartmentHead
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error browsing accessible EEG data");
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

    private AccessType GetAccessType(User currentUser, EegDataResponseDto eegData, bool isOwner)
    {
        if (isOwner) return AccessType.Owner;
        if (currentUser.Role == UserRole.Admin) return AccessType.Admin;
        if (currentUser.Role == UserRole.DepartmentHead) return AccessType.DepartmentHead;
        return AccessType.Shared;
    }
}