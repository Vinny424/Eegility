namespace EegilityApi.Services;

public interface IFileStorageService
{
    Task<string> StoreFileAsync(Stream fileStream, string fileName, string contentType);
    Task<Stream?> GetFileAsync(string fileName);
    Task<bool> DeleteFileAsync(string fileName);
    Task<bool> FileExistsAsync(string fileName);
    Task<long> GetFileSizeAsync(string fileName);
}