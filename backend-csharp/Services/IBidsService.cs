using EegilityApi.Models;

namespace EegilityApi.Services;

public interface IBidsService
{
    Task<bool> ValidateBidsComplianceAsync(EegData eegData);
    Task<BidsMetadata> GenerateBidsMetadataAsync(EegData eegData);
    Task<string> GenerateBidsFilenameAsync(EegData eegData);
    Task<Dictionary<string, object>> ValidateBidsStructureAsync(EegData eegData);
    Task<bool> ValidateSubjectMetadataAsync(SubjectMetadata subject);
}