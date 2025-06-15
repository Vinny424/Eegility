using AutoMapper;
using EegilityApi.Data;
using EegilityApi.Models;
using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;
using MongoDB.Driver.GridFS;

namespace EegilityApi.Services;

public class EegDataService : IEegDataService
{
    private readonly EegilityDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<EegDataService> _logger;
    private readonly IFileStorageService _fileStorageService;
    private readonly IBidsService _bidsService;
    private readonly IMongoClient _mongoClient;
    private readonly IGridFSBucket _gridFsBucket;

    public EegDataService(
        EegilityDbContext context,
        IMapper mapper,
        ILogger<EegDataService> logger,
        IFileStorageService fileStorageService,
        IBidsService bidsService,
        IMongoClient mongoClient)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
        _fileStorageService = fileStorageService;
        _bidsService = bidsService;
        _mongoClient = mongoClient;
        
        var database = _mongoClient.GetDatabase("eeg_database");
        _gridFsBucket = new GridFSBucket(database);
    }

    public async Task<EegDataResponseDto> UploadEegDataAsync(string userId, EegUploadDto uploadDto)
    {
        try
        {
            // Validate file format
            var fileExtension = Path.GetExtension(uploadDto.File.FileName).ToLowerInvariant();
            var format = GetEegFormatFromExtension(fileExtension);

            // Generate unique filename
            var uniqueFilename = $"{Guid.NewGuid()}{fileExtension}";

            // Store file using GridFS for large files
            string? gridFsId = null;
            if (uploadDto.File.Length > 16 * 1024 * 1024) // 16MB threshold
            {
                using var stream = uploadDto.File.OpenReadStream();
                var uploadOptions = new GridFSUploadOptions
                {
                    Metadata = new MongoDB.Bson.BsonDocument
                    {
                        ["originalFilename"] = uploadDto.File.FileName,
                        ["contentType"] = uploadDto.File.ContentType,
                        ["uploadedBy"] = userId,
                        ["uploadedAt"] = DateTime.UtcNow
                    }
                };

                var objectId = await _gridFsBucket.UploadFromStreamAsync(uniqueFilename, stream, uploadOptions);
                gridFsId = objectId.ToString();
            }

            // Create EEG data record
            var eegData = new EegData
            {
                UserId = userId,
                Filename = uniqueFilename,
                OriginalFilename = uploadDto.File.FileName,
                Format = format,
                Size = uploadDto.File.Length,
                UploadDate = DateTime.UtcNow,
                Notes = uploadDto.Notes,
                Tags = uploadDto.Tags,
                GridFsId = gridFsId,
                Metadata = new EegMetadata
                {
                    Subject = new SubjectMetadata
                    {
                        Id = uploadDto.SubjectId,
                        Age = uploadDto.SubjectAge,
                        Gender = uploadDto.SubjectGender,
                        Group = uploadDto.SubjectGroup
                    },
                    Session = uploadDto.Session,
                    Task = uploadDto.Task,
                    Acquisition = uploadDto.Acquisition
                }
            };

            // Check BIDS compliance
            eegData.BidsCompliant = await _bidsService.ValidateBidsComplianceAsync(eegData);

            _context.EegData.Add(eegData);
            await _context.SaveChangesAsync();

            _logger.LogInformation("EEG data uploaded successfully: {Filename} by user {UserId}", 
                eegData.OriginalFilename, userId);

            return _mapper.Map<EegDataResponseDto>(eegData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading EEG data for user {UserId}", userId);
            throw;
        }
    }

    public async Task<List<EegDataResponseDto>> GetUserEegDataAsync(string userId, int page = 1, int pageSize = 10)
    {
        try
        {
            var skip = (page - 1) * pageSize;
            var eegDataList = await _context.EegData
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.UploadDate)
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();

            return _mapper.Map<List<EegDataResponseDto>>(eegDataList);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving EEG data for user {UserId}", userId);
            throw;
        }
    }

    public async Task<EegDataResponseDto?> GetEegDataByIdAsync(string id, string userId)
    {
        try
        {
            var eegData = await _context.EegData
                .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

            return eegData != null ? _mapper.Map<EegDataResponseDto>(eegData) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving EEG data {Id} for user {UserId}", id, userId);
            throw;
        }
    }

    public async Task<bool> DeleteEegDataAsync(string id, string userId)
    {
        try
        {
            var eegData = await _context.EegData
                .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

            if (eegData == null)
                return false;

            // Delete from GridFS if exists
            if (!string.IsNullOrEmpty(eegData.GridFsId))
            {
                await _gridFsBucket.DeleteAsync(MongoDB.Bson.ObjectId.Parse(eegData.GridFsId));
            }

            _context.EegData.Remove(eegData);
            await _context.SaveChangesAsync();

            _logger.LogInformation("EEG data deleted: {Id} by user {UserId}", id, userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting EEG data {Id} for user {UserId}", id, userId);
            throw;
        }
    }

    public async Task<EegDataResponseDto> UpdateEegDataAsync(string id, string userId, EegDataResponseDto updateDto)
    {
        try
        {
            var eegData = await _context.EegData
                .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

            if (eegData == null)
                throw new NotFoundException("EEG data not found");

            // Update allowed fields
            eegData.Notes = updateDto.Notes;
            eegData.Tags = updateDto.Tags;
            eegData.Metadata = updateDto.Metadata;

            // Re-check BIDS compliance if metadata changed
            eegData.BidsCompliant = await _bidsService.ValidateBidsComplianceAsync(eegData);

            await _context.SaveChangesAsync();

            _logger.LogInformation("EEG data updated: {Id} by user {UserId}", id, userId);
            return _mapper.Map<EegDataResponseDto>(eegData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating EEG data {Id} for user {UserId}", id, userId);
            throw;
        }
    }

    public async Task<bool> RequestAdhdAnalysisAsync(string eegDataId, string userId)
    {
        try
        {
            var eegData = await _context.EegData
                .FirstOrDefaultAsync(e => e.Id == eegDataId && e.UserId == userId);

            if (eegData == null)
                return false;

            eegData.AdhdAnalysis = new AdhdAnalysis
            {
                Requested = true,
                Performed = false,
                InProgress = false
            };

            await _context.SaveChangesAsync();

            _logger.LogInformation("ADHD analysis requested for EEG data {Id} by user {UserId}", 
                eegDataId, userId);

            // Here you would trigger the ML service to process the request
            // For now, we'll just mark it as requested

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error requesting ADHD analysis for EEG data {Id}", eegDataId);
            throw;
        }
    }

    public async Task<AdhdAnalysis?> GetAdhdAnalysisAsync(string eegDataId, string userId)
    {
        try
        {
            var eegData = await _context.EegData
                .FirstOrDefaultAsync(e => e.Id == eegDataId && e.UserId == userId);

            return eegData?.AdhdAnalysis;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving ADHD analysis for EEG data {Id}", eegDataId);
            throw;
        }
    }

    public async Task<Stream?> DownloadEegDataAsync(string id, string userId)
    {
        try
        {
            var eegData = await _context.EegData
                .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

            if (eegData == null || string.IsNullOrEmpty(eegData.GridFsId))
                return null;

            return await _gridFsBucket.OpenDownloadStreamAsync(
                MongoDB.Bson.ObjectId.Parse(eegData.GridFsId));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading EEG data {Id} for user {UserId}", id, userId);
            throw;
        }
    }

    public async Task<bool> ValidateBidsComplianceAsync(string eegDataId)
    {
        try
        {
            var eegData = await _context.EegData.FindAsync(eegDataId);
            if (eegData == null)
                return false;

            return await _bidsService.ValidateBidsComplianceAsync(eegData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating BIDS compliance for EEG data {Id}", eegDataId);
            throw;
        }
    }

    public async Task<List<EegDataResponseDto>> SearchEegDataAsync(string userId, string? searchTerm, 
        List<string>? tags, EegFormat? format)
    {
        try
        {
            var query = _context.EegData.Where(e => e.UserId == userId);

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(e => 
                    e.OriginalFilename.Contains(searchTerm) ||
                    e.Notes.Contains(searchTerm) ||
                    e.Metadata.Subject.Id.Contains(searchTerm));
            }

            if (tags != null && tags.Any())
            {
                query = query.Where(e => e.Tags.Any(t => tags.Contains(t)));
            }

            if (format.HasValue)
            {
                query = query.Where(e => e.Format == format.Value);
            }

            var results = await query
                .OrderByDescending(e => e.UploadDate)
                .ToListAsync();

            return _mapper.Map<List<EegDataResponseDto>>(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching EEG data for user {UserId}", userId);
            throw;
        }
    }

    private static EegFormat GetEegFormatFromExtension(string extension)
    {
        return extension.ToLowerInvariant() switch
        {
            ".edf" => EegFormat.Edf,
            ".bdf" => EegFormat.Bdf,
            ".vhdr" => EegFormat.Vhdr,
            ".set" => EegFormat.Set,
            ".fif" => EegFormat.Fif,
            ".cnt" => EegFormat.Cnt,
            ".npy" => EegFormat.Npy,
            _ => throw new ArgumentException($"Unsupported file format: {extension}")
        };
    }
}

public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}