namespace EegilityApi.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _storagePath;
    private readonly ILogger<FileStorageService> _logger;

    public FileStorageService(IConfiguration configuration, ILogger<FileStorageService> logger)
    {
        _storagePath = configuration.GetValue<string>("FileStorage:Path") ?? "uploads";
        _logger = logger;

        // Ensure storage directory exists
        Directory.CreateDirectory(_storagePath);
    }

    public async Task<string> StoreFileAsync(Stream fileStream, string fileName, string contentType)
    {
        try
        {
            var filePath = Path.Combine(_storagePath, fileName);
            
            using var fileStreamDest = new FileStream(filePath, FileMode.Create);
            await fileStream.CopyToAsync(fileStreamDest);

            _logger.LogInformation("File stored successfully: {FileName}", fileName);
            return filePath;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error storing file: {FileName}", fileName);
            throw;
        }
    }

    public async Task<Stream?> GetFileAsync(string fileName)
    {
        try
        {
            var filePath = Path.Combine(_storagePath, fileName);
            
            if (!File.Exists(filePath))
                return null;

            return new FileStream(filePath, FileMode.Open, FileAccess.Read);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving file: {FileName}", fileName);
            throw;
        }
    }

    public async Task<bool> DeleteFileAsync(string fileName)
    {
        try
        {
            var filePath = Path.Combine(_storagePath, fileName);
            
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                _logger.LogInformation("File deleted successfully: {FileName}", fileName);
                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file: {FileName}", fileName);
            throw;
        }
    }

    public async Task<bool> FileExistsAsync(string fileName)
    {
        var filePath = Path.Combine(_storagePath, fileName);
        return File.Exists(filePath);
    }

    public async Task<long> GetFileSizeAsync(string fileName)
    {
        var filePath = Path.Combine(_storagePath, fileName);
        
        if (!File.Exists(filePath))
            return 0;

        var fileInfo = new FileInfo(filePath);
        return fileInfo.Length;
    }
}