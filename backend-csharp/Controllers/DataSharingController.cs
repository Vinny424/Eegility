using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using EegilityApi.Models;
using EegilityApi.Services;
using System.Security.Claims;
using MongoDB.Driver;

namespace EegilityApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DataSharingController : ControllerBase
{
    private readonly IDataSharingService _dataSharingService;
    private readonly IMongoCollection<User> _userCollection;
    private readonly IMongoCollection<EegData> _eegDataCollection;

    public DataSharingController(
        IDataSharingService dataSharingService,
        IMongoDatabase database)
    {
        _dataSharingService = dataSharingService;
        _userCollection = database.GetCollection<User>("users");
        _eegDataCollection = database.GetCollection<EegData>("eegdata");
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException();
    }

    [HttpPost("requests")]
    public async Task<ActionResult<SharingRequestResponseDto>> CreateSharingRequest(CreateSharingRequestDto request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var sharingRequest = await _dataSharingService.CreateSharingRequestAsync(request, userId);
            
            return Ok(await MapToResponseDto(sharingRequest));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpGet("requests/incoming")]
    public async Task<ActionResult<List<SharingRequestResponseDto>>> GetIncomingSharingRequests()
    {
        var userId = GetCurrentUserId();
        var requests = await _dataSharingService.GetIncomingSharingRequestsAsync(userId);
        
        var responseDtos = new List<SharingRequestResponseDto>();
        foreach (var request in requests)
        {
            responseDtos.Add(await MapToResponseDto(request));
        }
        
        return Ok(responseDtos);
    }

    [HttpGet("requests/outgoing")]
    public async Task<ActionResult<List<SharingRequestResponseDto>>> GetOutgoingSharingRequests()
    {
        var userId = GetCurrentUserId();
        var requests = await _dataSharingService.GetOutgoingSharingRequestsAsync(userId);
        
        var responseDtos = new List<SharingRequestResponseDto>();
        foreach (var request in requests)
        {
            responseDtos.Add(await MapToResponseDto(request));
        }
        
        return Ok(responseDtos);
    }

    [HttpGet("requests/{id}")]
    public async Task<ActionResult<SharingRequestResponseDto>> GetSharingRequest(string id)
    {
        var userId = GetCurrentUserId();
        var request = await _dataSharingService.GetSharingRequestByIdAsync(id, userId);
        
        if (request == null)
            return NotFound("Sharing request not found");

        return Ok(await MapToResponseDto(request));
    }

    [HttpPost("requests/{id}/accept")]
    public async Task<ActionResult<SharingRequestResponseDto>> AcceptSharingRequest(string id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var request = await _dataSharingService.AcceptSharingRequestAsync(id, userId);
            
            return Ok(await MapToResponseDto(request));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("requests/{id}/reject")]
    public async Task<ActionResult<SharingRequestResponseDto>> RejectSharingRequest(string id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var request = await _dataSharingService.RejectSharingRequestAsync(id, userId);
            
            return Ok(await MapToResponseDto(request));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    [HttpPost("requests/{id}/revoke")]
    public async Task<ActionResult<SharingRequestResponseDto>> RevokeSharingRequest(string id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var request = await _dataSharingService.RevokeSharingRequestAsync(id, userId);
            
            return Ok(await MapToResponseDto(request));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    [HttpGet("accessible-data")]
    public async Task<ActionResult<List<string>>> GetAccessibleEegDataIds()
    {
        var userId = GetCurrentUserId();
        var accessibleIds = await _dataSharingService.GetAccessibleEegDataIdsAsync(userId);
        
        return Ok(accessibleIds);
    }

    [HttpGet("data/{eegDataId}/permission")]
    public async Task<ActionResult<SharingPermission?>> GetUserPermissionForEegData(string eegDataId)
    {
        var userId = GetCurrentUserId();
        var permission = await _dataSharingService.GetUserPermissionForEegDataAsync(eegDataId, userId);
        
        return Ok(permission);
    }

    [HttpPost("cleanup-expired")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> CleanupExpiredRequests()
    {
        await _dataSharingService.CleanupExpiredRequestsAsync();
        return Ok(new { message = "Expired sharing requests cleaned up successfully" });
    }

    private async Task<SharingRequestResponseDto> MapToResponseDto(DataSharingRequest request)
    {
        var sharedByUser = await _userCollection.Find(x => x.Id == request.SharedByUserId).FirstOrDefaultAsync();
        var sharedWithUser = await _userCollection.Find(x => x.Id == request.SharedWithUserId).FirstOrDefaultAsync();
        var eegData = await _eegDataCollection.Find(x => x.Id == request.EegDataId).FirstOrDefaultAsync();

        return new SharingRequestResponseDto
        {
            Id = request.Id,
            EegDataId = request.EegDataId,
            EegDataFilename = eegData?.OriginalFilename ?? "Unknown",
            SharedByUserName = $"{sharedByUser?.FirstName} {sharedByUser?.LastName}",
            SharedByUserEmail = sharedByUser?.Email ?? "Unknown",
            SharedWithUserName = $"{sharedWithUser?.FirstName} {sharedWithUser?.LastName}",
            SharedWithUserEmail = sharedWithUser?.Email ?? "Unknown",
            Permission = request.Permission,
            Status = request.Status,
            Message = request.Message,
            RequestedAt = request.RequestedAt,
            AcceptedAt = request.AcceptedAt,
            ExpiresAt = request.ExpiresAt
        };
    }
}