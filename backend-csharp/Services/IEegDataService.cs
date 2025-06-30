using EegilityApi.Models;

namespace EegilityApi.Services;

public interface IEegDataService
{
    Task<EegDataResponseDto> UploadEegDataAsync(string userId, EegUploadDto uploadDto);
    Task<List<EegDataResponseDto>> GetUserEegDataAsync(string userId, int page = 1, int pageSize = 10);
    Task<EegDataResponseDto?> GetEegDataByIdAsync(string id, string userId);
    Task<bool> DeleteEegDataAsync(string id, string userId);
    Task<EegDataResponseDto> UpdateEegDataAsync(string id, string userId, EegDataResponseDto updateDto);
    Task<bool> RequestAdhdAnalysisAsync(string eegDataId, string userId);
    Task<AdhdAnalysis?> GetAdhdAnalysisAsync(string eegDataId, string userId);
    Task<Stream?> DownloadEegDataAsync(string id, string userId);
    Task<bool> ValidateBidsComplianceAsync(string eegDataId);
    Task<List<EegDataResponseDto>> SearchEegDataAsync(string userId, string? searchTerm, List<string>? tags, EegFormat? format);
    Task<List<EegDataResponseDto>> GetEegDataByIdsAsync(List<string> eegDataIds);
}