using EegilityApi.Models;
using MongoDB.Driver;
using MongoDB.Bson;

namespace EegilityApi.Services;

public class DataSharingService : IDataSharingService
{
    private readonly IMongoCollection<DataSharingRequest> _sharingCollection;
    private readonly IMongoCollection<EegData> _eegDataCollection;
    private readonly IMongoCollection<User> _userCollection;

    public DataSharingService(IMongoDatabase database)
    {
        _sharingCollection = database.GetCollection<DataSharingRequest>("datasharing");
        _eegDataCollection = database.GetCollection<EegData>("eegdata");
        _userCollection = database.GetCollection<User>("users");
    }

    public async Task<DataSharingRequest> CreateSharingRequestAsync(CreateSharingRequestDto request, string requesterId)
    {
        // Validate EEG data exists and belongs to requester
        var eegData = await _eegDataCollection
            .Find(x => x.Id == request.EegDataId && x.UserId == requesterId)
            .FirstOrDefaultAsync();
        
        if (eegData == null)
            throw new UnauthorizedAccessException("EEG data not found or access denied");

        // Find recipient user by email
        var recipientUser = await _userCollection
            .Find(x => x.Email == request.SharedWithUserEmail)
            .FirstOrDefaultAsync();
        
        if (recipientUser == null)
            throw new ArgumentException("Recipient user not found");

        // Check if sharing request already exists
        var existingRequest = await _sharingCollection
            .Find(x => x.EegDataId == request.EegDataId && 
                      x.SharedByUserId == requesterId && 
                      x.SharedWithUserId == recipientUser.Id &&
                      x.Status == SharingStatus.Pending)
            .FirstOrDefaultAsync();

        if (existingRequest != null)
            throw new InvalidOperationException("Sharing request already pending");

        var sharingRequest = new DataSharingRequest
        {
            EegDataId = request.EegDataId,
            SharedByUserId = requesterId,
            SharedWithUserId = recipientUser.Id,
            Permission = request.Permission,
            Message = request.Message,
            ExpiresAt = request.ExpiresAt,
            Status = SharingStatus.Pending
        };

        await _sharingCollection.InsertOneAsync(sharingRequest);
        return sharingRequest;
    }

    public async Task<List<DataSharingRequest>> GetIncomingSharingRequestsAsync(string userId)
    {
        return await _sharingCollection
            .Find(x => x.SharedWithUserId == userId)
            .SortByDescending(x => x.RequestedAt)
            .ToListAsync();
    }

    public async Task<List<DataSharingRequest>> GetOutgoingSharingRequestsAsync(string userId)
    {
        return await _sharingCollection
            .Find(x => x.SharedByUserId == userId)
            .SortByDescending(x => x.RequestedAt)
            .ToListAsync();
    }

    public async Task<DataSharingRequest?> GetSharingRequestByIdAsync(string id, string userId)
    {
        return await _sharingCollection
            .Find(x => x.Id == id && 
                      (x.SharedByUserId == userId || x.SharedWithUserId == userId))
            .FirstOrDefaultAsync();
    }

    public async Task<DataSharingRequest> AcceptSharingRequestAsync(string requestId, string userId)
    {
        var request = await _sharingCollection
            .Find(x => x.Id == requestId && x.SharedWithUserId == userId && x.Status == SharingStatus.Pending)
            .FirstOrDefaultAsync();

        if (request == null)
            throw new UnauthorizedAccessException("Sharing request not found or access denied");

        // Check if request has expired
        if (request.ExpiresAt.HasValue && request.ExpiresAt < DateTime.UtcNow)
        {
            request.Status = SharingStatus.Expired;
            await _sharingCollection.ReplaceOneAsync(x => x.Id == requestId, request);
            throw new InvalidOperationException("Sharing request has expired");
        }

        // Update request status
        request.Status = SharingStatus.Accepted;
        request.AcceptedAt = DateTime.UtcNow;

        // Update EEG data sharing info
        var eegDataUpdate = Builders<EegData>.Update
            .Set(x => x.IsShared, true)
            .AddToSet(x => x.SharedWithUserIds, userId)
            .Set(x => x.LastSharedAt, DateTime.UtcNow);

        await _eegDataCollection.UpdateOneAsync(x => x.Id == request.EegDataId, eegDataUpdate);
        await _sharingCollection.ReplaceOneAsync(x => x.Id == requestId, request);

        return request;
    }

    public async Task<DataSharingRequest> RejectSharingRequestAsync(string requestId, string userId)
    {
        var request = await _sharingCollection
            .Find(x => x.Id == requestId && x.SharedWithUserId == userId && x.Status == SharingStatus.Pending)
            .FirstOrDefaultAsync();

        if (request == null)
            throw new UnauthorizedAccessException("Sharing request not found or access denied");

        request.Status = SharingStatus.Rejected;
        request.RejectedAt = DateTime.UtcNow;

        await _sharingCollection.ReplaceOneAsync(x => x.Id == requestId, request);
        return request;
    }

    public async Task<DataSharingRequest> RevokeSharingRequestAsync(string requestId, string userId)
    {
        var request = await _sharingCollection
            .Find(x => x.Id == requestId && x.SharedByUserId == userId && 
                      (x.Status == SharingStatus.Pending || x.Status == SharingStatus.Accepted))
            .FirstOrDefaultAsync();

        if (request == null)
            throw new UnauthorizedAccessException("Sharing request not found or access denied");

        request.Status = SharingStatus.Revoked;

        // Remove user from shared access if previously accepted
        if (request.Status == SharingStatus.Accepted)
        {
            var eegDataUpdate = Builders<EegData>.Update
                .Pull(x => x.SharedWithUserIds, request.SharedWithUserId);

            await _eegDataCollection.UpdateOneAsync(x => x.Id == request.EegDataId, eegDataUpdate);

            // Check if EEG data should still be marked as shared
            var otherActiveSharing = await _sharingCollection
                .Find(x => x.EegDataId == request.EegDataId && 
                          x.Status == SharingStatus.Accepted && 
                          x.Id != requestId)
                .AnyAsync();

            if (!otherActiveSharing)
            {
                await _eegDataCollection.UpdateOneAsync(
                    x => x.Id == request.EegDataId,
                    Builders<EegData>.Update.Set(x => x.IsShared, false));
            }
        }

        await _sharingCollection.ReplaceOneAsync(x => x.Id == requestId, request);
        return request;
    }

    public async Task<bool> CanUserAccessEegDataAsync(string eegDataId, string userId)
    {
        var user = await _userCollection.Find(x => x.Id == userId).FirstOrDefaultAsync();
        if (user == null) return false;

        // Admin and department heads have special access - check in controller
        if (user.Role == UserRole.Admin || user.Role == UserRole.DepartmentHead)
            return true;

        var eegData = await _eegDataCollection.Find(x => x.Id == eegDataId).FirstOrDefaultAsync();
        if (eegData == null) return false;

        // Owner can always access
        if (eegData.UserId == userId) return true;

        // Check if user has accepted sharing access
        var hasAccess = await _sharingCollection
            .Find(x => x.EegDataId == eegDataId && 
                      x.SharedWithUserId == userId && 
                      x.Status == SharingStatus.Accepted &&
                      (!x.ExpiresAt.HasValue || x.ExpiresAt > DateTime.UtcNow))
            .AnyAsync();

        return hasAccess;
    }

    public async Task<List<string>> GetAccessibleEegDataIdsAsync(string userId)
    {
        var user = await _userCollection.Find(x => x.Id == userId).FirstOrDefaultAsync();
        if (user == null) return new List<string>();

        var accessibleIds = new List<string>();

        // Admin sees all data
        if (user.Role == UserRole.Admin)
        {
            var allEegData = await _eegDataCollection.Find(_ => true).ToListAsync();
            return allEegData.Select(x => x.Id).ToList();
        }

        // Department head sees department data
        if (user.Role == UserRole.DepartmentHead && !string.IsNullOrEmpty(user.Department))
        {
            var departmentUsers = await _userCollection
                .Find(x => x.Department == user.Department)
                .ToListAsync();
            
            var departmentUserIds = departmentUsers.Select(x => x.Id).ToList();
            
            var departmentEegData = await _eegDataCollection
                .Find(x => departmentUserIds.Contains(x.UserId))
                .ToListAsync();
            
            accessibleIds.AddRange(departmentEegData.Select(x => x.Id));
        }
        else
        {
            // Regular user: own data + shared data
            var ownData = await _eegDataCollection
                .Find(x => x.UserId == userId)
                .ToListAsync();
            
            accessibleIds.AddRange(ownData.Select(x => x.Id));
        }

        // Add shared data for all user types
        var sharedRequests = await _sharingCollection
            .Find(x => x.SharedWithUserId == userId && 
                      x.Status == SharingStatus.Accepted &&
                      (!x.ExpiresAt.HasValue || x.ExpiresAt > DateTime.UtcNow))
            .ToListAsync();

        accessibleIds.AddRange(sharedRequests.Select(x => x.EegDataId));

        return accessibleIds.Distinct().ToList();
    }

    public async Task<SharingPermission?> GetUserPermissionForEegDataAsync(string eegDataId, string userId)
    {
        var eegData = await _eegDataCollection.Find(x => x.Id == eegDataId).FirstOrDefaultAsync();
        if (eegData == null) return null;

        // Owner has full permissions
        if (eegData.UserId == userId) return SharingPermission.ViewDownload;

        var user = await _userCollection.Find(x => x.Id == userId).FirstOrDefaultAsync();
        if (user == null) return null;

        // Admin and department heads have full permissions
        if (user.Role == UserRole.Admin || user.Role == UserRole.DepartmentHead)
            return SharingPermission.ViewDownload;

        // Check shared permissions
        var sharingRequest = await _sharingCollection
            .Find(x => x.EegDataId == eegDataId && 
                      x.SharedWithUserId == userId && 
                      x.Status == SharingStatus.Accepted &&
                      (!x.ExpiresAt.HasValue || x.ExpiresAt > DateTime.UtcNow))
            .FirstOrDefaultAsync();

        return sharingRequest?.Permission;
    }

    public async Task CleanupExpiredRequestsAsync()
    {
        var expiredRequests = await _sharingCollection
            .Find(x => x.ExpiresAt.HasValue && x.ExpiresAt < DateTime.UtcNow && x.Status != SharingStatus.Expired)
            .ToListAsync();

        foreach (var request in expiredRequests)
        {
            request.Status = SharingStatus.Expired;
            
            // Remove from shared access if was accepted
            if (request.Status == SharingStatus.Accepted)
            {
                var eegDataUpdate = Builders<EegData>.Update
                    .Pull(x => x.SharedWithUserIds, request.SharedWithUserId);

                await _eegDataCollection.UpdateOneAsync(x => x.Id == request.EegDataId, eegDataUpdate);
            }

            await _sharingCollection.ReplaceOneAsync(x => x.Id == request.Id, request);
        }
    }
}