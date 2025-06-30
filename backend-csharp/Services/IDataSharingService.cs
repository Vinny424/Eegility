using EegilityApi.Models;

namespace EegilityApi.Services;

public interface IDataSharingService
{
    // Create sharing request
    Task<DataSharingRequest> CreateSharingRequestAsync(CreateSharingRequestDto request, string requesterId);
    
    // Get sharing requests
    Task<List<DataSharingRequest>> GetIncomingSharingRequestsAsync(string userId);
    Task<List<DataSharingRequest>> GetOutgoingSharingRequestsAsync(string userId);
    Task<DataSharingRequest?> GetSharingRequestByIdAsync(string id, string userId);
    
    // Handle sharing actions
    Task<DataSharingRequest> AcceptSharingRequestAsync(string requestId, string userId);
    Task<DataSharingRequest> RejectSharingRequestAsync(string requestId, string userId);
    Task<DataSharingRequest> RevokeSharingRequestAsync(string requestId, string userId);
    
    // Access control helpers
    Task<bool> CanUserAccessEegDataAsync(string eegDataId, string userId);
    Task<List<string>> GetAccessibleEegDataIdsAsync(string userId);
    Task<SharingPermission?> GetUserPermissionForEegDataAsync(string eegDataId, string userId);
    
    // Cleanup expired requests
    Task CleanupExpiredRequestsAsync();
}