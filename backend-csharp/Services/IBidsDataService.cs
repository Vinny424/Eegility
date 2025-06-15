using EegilityApi.Models;

namespace EegilityApi.Services;

public interface IBidsDataService
{
    // Dataset management
    Task<BidsDatasetDto> CreateDatasetAsync(string userId, BidsDatasetDto datasetDto);
    Task<List<BidsDatasetDto>> GetUserDatasetsAsync(string userId);
    Task<BidsDatasetDto?> GetDatasetByIdAsync(string datasetId, string userId);
    Task<BidsDatasetDto> UpdateDatasetAsync(string datasetId, string userId, BidsDatasetDto datasetDto);
    Task<bool> DeleteDatasetAsync(string datasetId, string userId);

    // Subject management
    Task<BidsSubjectDto> CreateSubjectAsync(string datasetId, string userId, BidsSubjectDto subjectDto);
    Task<List<BidsSubjectDto>> GetDatasetSubjectsAsync(string datasetId, string userId);
    Task<BidsSubjectDto?> GetSubjectByIdAsync(string subjectId, string userId);
    Task<BidsSubjectDto> UpdateSubjectAsync(string subjectId, string userId, BidsSubjectDto subjectDto);
    Task<bool> DeleteSubjectAsync(string subjectId, string userId);

    // Session management
    Task<BidsSessionDto> CreateSessionAsync(string subjectId, string userId, BidsSessionDto sessionDto);
    Task<List<BidsSessionDto>> GetSubjectSessionsAsync(string subjectId, string userId);
    Task<BidsSessionDto?> GetSessionByIdAsync(string sessionId, string userId);
    Task<BidsSessionDto> UpdateSessionAsync(string sessionId, string userId, BidsSessionDto sessionDto);
    Task<bool> DeleteSessionAsync(string sessionId, string userId);

    // EEG Recording management
    Task<BidsEegRecordingDto> UploadBidsRecordingAsync(string userId, BidsUploadRequest uploadRequest);
    Task<List<BidsEegRecordingDto>> GetSessionRecordingsAsync(string sessionId, string userId);
    Task<BidsEegRecordingDto?> GetRecordingByIdAsync(string recordingId, string userId);
    Task<BidsEegRecordingDto> UpdateRecordingAsync(string recordingId, string userId, BidsEegRecordingDto recordingDto);
    Task<bool> DeleteRecordingAsync(string recordingId, string userId);

    // BIDS validation and export
    Task<BidsValidationResult> ValidateDatasetAsync(string datasetId, string userId);
    Task<Stream> ExportBidsDatasetAsync(string datasetId, string userId);
    Task<Dictionary<string, object>> GenerateDatasetDescriptionAsync(string datasetId);
    Task<List<Dictionary<string, object>>> GenerateParticipantsTsvAsync(string datasetId);

    // Search and filtering
    Task<List<BidsEegRecordingDto>> SearchRecordingsAsync(string userId, BidsSearchParams searchParams);
    Task<List<BidsSubjectDto>> SearchSubjectsAsync(string userId, SubjectSearchParams searchParams);

    // Statistics and analytics
    Task<BidsDatasetStatistics> GetDatasetStatisticsAsync(string datasetId, string userId);
    Task<List<BidsDatasetStatistics>> GetUserStatisticsAsync(string userId);
}

public class BidsValidationResult
{
    public bool IsValid { get; set; }
    public List<BidsValidationError> Errors { get; set; } = new();
    public List<BidsValidationWarning> Warnings { get; set; } = new();
    public BidsValidationSummary Summary { get; set; } = new();
}

public class BidsValidationError
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string File { get; set; } = string.Empty;
    public string Severity { get; set; } = "error";
}

public class BidsValidationWarning
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string File { get; set; } = string.Empty;
    public string Severity { get; set; } = "warning";
}

public class BidsValidationSummary
{
    public int TotalFiles { get; set; }
    public int ValidFiles { get; set; }
    public int ErrorCount { get; set; }
    public int WarningCount { get; set; }
    public DateTime ValidatedAt { get; set; } = DateTime.UtcNow;
}

public class BidsSearchParams
{
    public string? DatasetId { get; set; }
    public string? SubjectId { get; set; }
    public string? SessionId { get; set; }
    public string? Task { get; set; }
    public string? Acquisition { get; set; }
    public EegFormat? Format { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public List<string>? Tags { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class SubjectSearchParams
{
    public string? DatasetId { get; set; }
    public string? Group { get; set; }
    public string? Sex { get; set; }
    public int? MinAge { get; set; }
    public int? MaxAge { get; set; }
    public string? Diagnosis { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class BidsDatasetStatistics
{
    public string DatasetId { get; set; } = string.Empty;
    public string DatasetName { get; set; } = string.Empty;
    public int SubjectCount { get; set; }
    public int SessionCount { get; set; }
    public int RecordingCount { get; set; }
    public long TotalSize { get; set; }
    public Dictionary<string, int> TaskCounts { get; set; } = new();
    public Dictionary<string, int> FormatCounts { get; set; } = new();
    public Dictionary<string, int> GroupCounts { get; set; } = new();
    public Dictionary<string, int> SexCounts { get; set; } = new();
    public DateTime? EarliestRecording { get; set; }
    public DateTime? LatestRecording { get; set; }
    public double? AverageRecordingDuration { get; set; }
    public double? AverageSamplingRate { get; set; }
}