using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace EegilityApi.Models;

public class DataSharingRequest
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [BsonRepresentation(BsonType.ObjectId)]
    public string EegDataId { get; set; } = string.Empty;

    [Required]
    [BsonRepresentation(BsonType.ObjectId)]
    public string SharedByUserId { get; set; } = string.Empty;

    [Required]
    [BsonRepresentation(BsonType.ObjectId)]
    public string SharedWithUserId { get; set; } = string.Empty;

    [Required]
    public SharingPermission Permission { get; set; } = SharingPermission.ViewOnly;

    [Required]
    public SharingStatus Status { get; set; } = SharingStatus.Pending;

    public string Message { get; set; } = string.Empty;

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    public DateTime? AcceptedAt { get; set; }

    public DateTime? RejectedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    // Navigation properties
    public virtual EegData? EegData { get; set; }
    public virtual User? SharedByUser { get; set; }
    public virtual User? SharedWithUser { get; set; }
}

public enum SharingPermission
{
    ViewOnly,       // Can view data and analysis results
    ViewDownload    // Can view and download data files
}

public enum SharingStatus
{
    Pending,        // Awaiting recipient acceptance
    Accepted,       // Active sharing
    Rejected,       // Recipient declined
    Revoked,        // Sharer revoked access
    Expired         // Sharing period expired
}

// DTOs for API
public class CreateSharingRequestDto
{
    [Required]
    public string EegDataId { get; set; } = string.Empty;

    [Required]
    public string SharedWithUserEmail { get; set; } = string.Empty;

    public SharingPermission Permission { get; set; } = SharingPermission.ViewOnly;

    public string Message { get; set; } = string.Empty;

    public DateTime? ExpiresAt { get; set; }
}

public class SharingRequestResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string EegDataId { get; set; } = string.Empty;
    public string EegDataFilename { get; set; } = string.Empty;
    public string SharedByUserName { get; set; } = string.Empty;
    public string SharedByUserEmail { get; set; } = string.Empty;
    public string SharedWithUserName { get; set; } = string.Empty;
    public string SharedWithUserEmail { get; set; } = string.Empty;
    public SharingPermission Permission { get; set; }
    public SharingStatus Status { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class SharingActionDto
{
    [Required]
    public string SharingRequestId { get; set; } = string.Empty;

    [Required]
    public SharingAction Action { get; set; }
}

public enum SharingAction
{
    Accept,
    Reject,
    Revoke
}