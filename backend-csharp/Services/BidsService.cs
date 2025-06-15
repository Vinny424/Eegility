using EegilityApi.Models;
using System.Text.RegularExpressions;

namespace EegilityApi.Services;

public class BidsService : IBidsService
{
    private readonly ILogger<BidsService> _logger;

    public BidsService(ILogger<BidsService> logger)
    {
        _logger = logger;
    }

    public async Task<bool> ValidateBidsComplianceAsync(EegData eegData)
    {
        try
        {
            var validationResults = await ValidateBidsStructureAsync(eegData);
            
            // Check if all validation criteria are met
            var isCompliant = validationResults.Values.All(result => (bool)result);
            
            _logger.LogInformation("BIDS validation completed for {FileName}: {IsCompliant}", 
                eegData.OriginalFilename, isCompliant);
            
            return isCompliant;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating BIDS compliance for {FileName}", eegData.OriginalFilename);
            return false;
        }
    }

    public async Task<BidsMetadata> GenerateBidsMetadataAsync(EegData eegData)
    {
        try
        {
            var bidsMetadata = new BidsMetadata
            {
                Subject = GenerateSubjectId(eegData.Metadata.Subject.Id),
                Session = GenerateSessionId(eegData.Metadata.Session),
                Task = GenerateTaskId(eegData.Metadata.Task),
                Acquisition = eegData.Metadata.Acquisition,
                Run = "01", // Default run number
                Recording = "eeg"
            };

            // Generate participants.tsv data
            bidsMetadata.Participants = new Dictionary<string, object>
            {
                ["participant_id"] = bidsMetadata.Subject,
                ["age"] = eegData.Metadata.Subject.Age ?? 0,
                ["sex"] = MapGenderToBids(eegData.Metadata.Subject.Gender),
                ["group"] = eegData.Metadata.Subject.Group,
                ["handedness"] = eegData.Metadata.Subject.Handedness
            };

            // Generate task metadata
            bidsMetadata.TaskMetadata = new Dictionary<string, object>
            {
                ["TaskName"] = eegData.Metadata.Task,
                ["SamplingFrequency"] = eegData.Metadata.SampleRate,
                ["EEGChannelCount"] = eegData.Metadata.Channels,
                ["RecordingDuration"] = eegData.Metadata.Duration,
                ["PowerLineFrequency"] = 50, // Default to 50Hz, could be configurable
                ["EEGReference"] = "unknown"
            };

            return bidsMetadata;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating BIDS metadata for {FileName}", eegData.OriginalFilename);
            throw;
        }
    }

    public async Task<string> GenerateBidsFilenameAsync(EegData eegData)
    {
        try
        {
            var bidsMetadata = await GenerateBidsMetadataAsync(eegData);
            var extension = GetBidsExtension(eegData.Format);

            // Generate BIDS-compliant filename: sub-<subject>_ses-<session>_task-<task>_eeg.<ext>
            var filename = $"sub-{bidsMetadata.Subject}";
            
            if (!string.IsNullOrEmpty(bidsMetadata.Session))
                filename += $"_ses-{bidsMetadata.Session}";
            
            if (!string.IsNullOrEmpty(bidsMetadata.Task))
                filename += $"_task-{bidsMetadata.Task}";
            
            if (!string.IsNullOrEmpty(bidsMetadata.Acquisition))
                filename += $"_acq-{bidsMetadata.Acquisition}";
            
            if (!string.IsNullOrEmpty(bidsMetadata.Run))
                filename += $"_run-{bidsMetadata.Run}";

            filename += $"_eeg{extension}";

            return filename;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating BIDS filename for {FileName}", eegData.OriginalFilename);
            throw;
        }
    }

    public async Task<Dictionary<string, object>> ValidateBidsStructureAsync(EegData eegData)
    {
        var validationResults = new Dictionary<string, object>();

        try
        {
            // Validate subject ID
            validationResults["ValidSubjectId"] = ValidateSubjectId(eegData.Metadata.Subject.Id);
            
            // Validate session (optional)
            validationResults["ValidSession"] = string.IsNullOrEmpty(eegData.Metadata.Session) || 
                                                ValidateSessionId(eegData.Metadata.Session);
            
            // Validate task
            validationResults["ValidTask"] = ValidateTaskId(eegData.Metadata.Task);
            
            // Validate subject metadata
            validationResults["ValidSubjectMetadata"] = await ValidateSubjectMetadataAsync(eegData.Metadata.Subject);
            
            // Validate required fields
            validationResults["HasRequiredFields"] = 
                !string.IsNullOrEmpty(eegData.Metadata.Subject.Id) &&
                eegData.Metadata.Channels > 0 &&
                eegData.Metadata.SampleRate > 0;
            
            // Validate file format
            validationResults["SupportedFormat"] = IsSupportedBidsFormat(eegData.Format);

            return validationResults;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating BIDS structure for {FileName}", eegData.OriginalFilename);
            validationResults["ValidationError"] = ex.Message;
            return validationResults;
        }
    }

    public async Task<bool> ValidateSubjectMetadataAsync(SubjectMetadata subject)
    {
        try
        {
            // Check required fields
            if (string.IsNullOrEmpty(subject.Id))
                return false;

            // Validate subject ID format
            if (!ValidateSubjectId(subject.Id))
                return false;

            // Validate optional fields if present
            if (subject.Age.HasValue && (subject.Age < 0 || subject.Age > 150))
                return false;

            if (!string.IsNullOrEmpty(subject.Gender) && 
                !new[] { "M", "F", "O", "m", "f", "o", "male", "female", "other" }.Contains(subject.Gender))
                return false;

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating subject metadata for subject {SubjectId}", subject.Id);
            return false;
        }
    }

    private static string GenerateSubjectId(string? originalId)
    {
        if (string.IsNullOrEmpty(originalId))
            return $"{DateTime.UtcNow:yyyyMMdd}{Random.Shared.Next(1000, 9999)}";

        // Clean the ID to make it BIDS-compliant (alphanumeric only)
        var cleanId = Regex.Replace(originalId, @"[^a-zA-Z0-9]", "");
        return string.IsNullOrEmpty(cleanId) ? $"sub{Random.Shared.Next(1000, 9999)}" : cleanId;
    }

    private static string GenerateSessionId(string? originalSession)
    {
        if (string.IsNullOrEmpty(originalSession))
            return string.Empty;

        // Clean the session ID to make it BIDS-compliant
        var cleanSession = Regex.Replace(originalSession, @"[^a-zA-Z0-9]", "");
        return string.IsNullOrEmpty(cleanSession) ? "01" : cleanSession;
    }

    private static string GenerateTaskId(string? originalTask)
    {
        if (string.IsNullOrEmpty(originalTask))
            return "rest";

        // Clean the task ID to make it BIDS-compliant
        var cleanTask = Regex.Replace(originalTask, @"[^a-zA-Z0-9]", "");
        return string.IsNullOrEmpty(cleanTask) ? "rest" : cleanTask.ToLowerInvariant();
    }

    private static bool ValidateSubjectId(string? subjectId)
    {
        if (string.IsNullOrEmpty(subjectId))
            return false;

        // BIDS subject ID should be alphanumeric
        return Regex.IsMatch(subjectId, @"^[a-zA-Z0-9]+$");
    }

    private static bool ValidateSessionId(string? sessionId)
    {
        if (string.IsNullOrEmpty(sessionId))
            return true; // Session is optional

        // BIDS session ID should be alphanumeric
        return Regex.IsMatch(sessionId, @"^[a-zA-Z0-9]+$");
    }

    private static bool ValidateTaskId(string? taskId)
    {
        if (string.IsNullOrEmpty(taskId))
            return false;

        // BIDS task ID should be alphanumeric (lowercase recommended)
        return Regex.IsMatch(taskId, @"^[a-zA-Z0-9]+$");
    }

    private static string MapGenderToBids(string? gender)
    {
        if (string.IsNullOrEmpty(gender))
            return "n/a";

        return gender.ToLowerInvariant() switch
        {
            "m" or "male" => "M",
            "f" or "female" => "F",
            "o" or "other" => "O",
            _ => "n/a"
        };
    }

    private static string GetBidsExtension(EegFormat format)
    {
        return format switch
        {
            EegFormat.Edf => ".edf",
            EegFormat.Bdf => ".bdf",
            EegFormat.Vhdr => ".vhdr",
            EegFormat.Set => ".set",
            EegFormat.Fif => ".fif",
            EegFormat.Cnt => ".cnt",
            EegFormat.Npy => ".npy",
            _ => ".eeg"
        };
    }

    private static bool IsSupportedBidsFormat(EegFormat format)
    {
        // BIDS officially supports these EEG formats
        return format is EegFormat.Edf or EegFormat.Bdf or EegFormat.Vhdr or 
                        EegFormat.Set or EegFormat.Fif or EegFormat.Cnt;
    }
}