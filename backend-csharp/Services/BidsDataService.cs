using AutoMapper;
using EegilityApi.Data;
using EegilityApi.Models;
using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;
using MongoDB.Driver.GridFS;
using System.Text;
using System.Text.Json;
using System.IO.Compression;

namespace EegilityApi.Services;

public class BidsDataService : IBidsDataService
{
    private readonly BidsDbContext _bidsContext;
    private readonly EegilityDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<BidsDataService> _logger;
    private readonly IBidsService _bidsService;
    private readonly IGridFSBucket _gridFsBucket;

    public BidsDataService(
        BidsDbContext bidsContext,
        EegilityDbContext context,
        IMapper mapper,
        ILogger<BidsDataService> logger,
        IBidsService bidsService,
        IMongoClient mongoClient)
    {
        _bidsContext = bidsContext;
        _context = context;
        _mapper = mapper;
        _logger = logger;
        _bidsService = bidsService;
        
        var database = mongoClient.GetDatabase("eeg_database");
        _gridFsBucket = new GridFSBucket(database);
    }

    #region Dataset Management

    public async Task<BidsDatasetDto> CreateDatasetAsync(string userId, BidsDatasetDto datasetDto)
    {
        try
        {
            var dataset = new BidsDataset
            {
                Name = datasetDto.Name,
                Description = datasetDto.Description,
                Authors = datasetDto.Authors,
                DatasetVersion = datasetDto.DatasetVersion,
                License = datasetDto.License,
                BidsVersion = datasetDto.BidsVersion,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _bidsContext.BidsDatasets.Add(dataset);
            await _bidsContext.SaveChangesAsync();

            _logger.LogInformation("BIDS dataset created: {DatasetName} by user {UserId}", dataset.Name, userId);

            return _mapper.Map<BidsDatasetDto>(dataset);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating BIDS dataset for user {UserId}", userId);
            throw;
        }
    }

    public async Task<List<BidsDatasetDto>> GetUserDatasetsAsync(string userId)
    {
        try
        {
            var datasets = await _bidsContext.BidsDatasets
                .Where(d => d.CreatedBy == userId)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();

            var datasetDtos = new List<BidsDatasetDto>();

            foreach (var dataset in datasets)
            {
                var dto = _mapper.Map<BidsDatasetDto>(dataset);
                
                // Get counts
                dto.SubjectCount = await _bidsContext.BidsSubjects.CountAsync(s => s.DatasetId == dataset.Id);
                dto.SessionCount = await _bidsContext.BidsSessions
                    .CountAsync(s => _bidsContext.BidsSubjects.Any(sub => sub.Id == s.SubjectId && sub.DatasetId == dataset.Id));
                dto.RecordingCount = await _bidsContext.BidsEegRecordings
                    .CountAsync(r => _bidsContext.BidsSessions
                        .Any(s => s.Id == r.SessionId && 
                                 _bidsContext.BidsSubjects.Any(sub => sub.Id == s.SubjectId && sub.DatasetId == dataset.Id)));

                datasetDtos.Add(dto);
            }

            return datasetDtos;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving BIDS datasets for user {UserId}", userId);
            throw;
        }
    }

    public async Task<BidsDatasetDto?> GetDatasetByIdAsync(string datasetId, string userId)
    {
        try
        {
            var dataset = await _bidsContext.BidsDatasets
                .FirstOrDefaultAsync(d => d.Id == datasetId && d.CreatedBy == userId);

            if (dataset == null)
                return null;

            var dto = _mapper.Map<BidsDatasetDto>(dataset);
            
            // Get counts
            dto.SubjectCount = await _bidsContext.BidsSubjects.CountAsync(s => s.DatasetId == dataset.Id);
            dto.SessionCount = await _bidsContext.BidsSessions
                .CountAsync(s => _bidsContext.BidsSubjects.Any(sub => sub.Id == s.SubjectId && sub.DatasetId == dataset.Id));
            dto.RecordingCount = await _bidsContext.BidsEegRecordings
                .CountAsync(r => _bidsContext.BidsSessions
                    .Any(s => s.Id == r.SessionId && 
                             _bidsContext.BidsSubjects.Any(sub => sub.Id == s.SubjectId && sub.DatasetId == dataset.Id)));

            return dto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving BIDS dataset {DatasetId} for user {UserId}", datasetId, userId);
            throw;
        }
    }

    public async Task<BidsDatasetDto> UpdateDatasetAsync(string datasetId, string userId, BidsDatasetDto datasetDto)
    {
        try
        {
            var dataset = await _bidsContext.BidsDatasets
                .FirstOrDefaultAsync(d => d.Id == datasetId && d.CreatedBy == userId);

            if (dataset == null)
                throw new NotFoundException("Dataset not found");

            dataset.Name = datasetDto.Name;
            dataset.Description = datasetDto.Description;
            dataset.Authors = datasetDto.Authors;
            dataset.DatasetVersion = datasetDto.DatasetVersion;
            dataset.License = datasetDto.License;
            dataset.UpdatedAt = DateTime.UtcNow;

            await _bidsContext.SaveChangesAsync();

            _logger.LogInformation("BIDS dataset updated: {DatasetId} by user {UserId}", datasetId, userId);

            return _mapper.Map<BidsDatasetDto>(dataset);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating BIDS dataset {DatasetId} for user {UserId}", datasetId, userId);
            throw;
        }
    }

    public async Task<bool> DeleteDatasetAsync(string datasetId, string userId)
    {
        try
        {
            var dataset = await _bidsContext.BidsDatasets
                .FirstOrDefaultAsync(d => d.Id == datasetId && d.CreatedBy == userId);

            if (dataset == null)
                return false;

            // Delete all related data (cascade delete)
            var subjects = await _bidsContext.BidsSubjects
                .Where(s => s.DatasetId == datasetId)
                .ToListAsync();

            foreach (var subject in subjects)
            {
                var sessions = await _bidsContext.BidsSessions
                    .Where(s => s.SubjectId == subject.Id)
                    .ToListAsync();

                foreach (var session in sessions)
                {
                    var recordings = await _bidsContext.BidsEegRecordings
                        .Where(r => r.SessionId == session.Id)
                        .ToListAsync();

                    // Delete GridFS files
                    foreach (var recording in recordings)
                    {
                        if (!string.IsNullOrEmpty(recording.GridFsId))
                        {
                            await _gridFsBucket.DeleteAsync(MongoDB.Bson.ObjectId.Parse(recording.GridFsId));
                        }
                    }

                    _bidsContext.BidsEegRecordings.RemoveRange(recordings);
                }

                _bidsContext.BidsSessions.RemoveRange(sessions);
            }

            _bidsContext.BidsSubjects.RemoveRange(subjects);
            _bidsContext.BidsDatasets.Remove(dataset);

            await _bidsContext.SaveChangesAsync();

            _logger.LogInformation("BIDS dataset deleted: {DatasetId} by user {UserId}", datasetId, userId);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting BIDS dataset {DatasetId} for user {UserId}", datasetId, userId);
            throw;
        }
    }

    #endregion

    #region Subject Management

    public async Task<BidsSubjectDto> CreateSubjectAsync(string datasetId, string userId, BidsSubjectDto subjectDto)
    {
        try
        {
            // Verify dataset ownership
            var dataset = await _bidsContext.BidsDatasets
                .FirstOrDefaultAsync(d => d.Id == datasetId && d.CreatedBy == userId);

            if (dataset == null)
                throw new NotFoundException("Dataset not found");

            var subject = new BidsSubject
            {
                SubjectId = subjectDto.SubjectId,
                DatasetId = datasetId,
                Demographics = subjectDto.Demographics,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _bidsContext.BidsSubjects.Add(subject);
            await _bidsContext.SaveChangesAsync();

            _logger.LogInformation("BIDS subject created: {SubjectId} in dataset {DatasetId}", subject.SubjectId, datasetId);

            return _mapper.Map<BidsSubjectDto>(subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating BIDS subject for dataset {DatasetId}", datasetId);
            throw;
        }
    }

    public async Task<List<BidsSubjectDto>> GetDatasetSubjectsAsync(string datasetId, string userId)
    {
        try
        {
            // Verify dataset ownership
            var dataset = await _bidsContext.BidsDatasets
                .FirstOrDefaultAsync(d => d.Id == datasetId && d.CreatedBy == userId);

            if (dataset == null)
                throw new NotFoundException("Dataset not found");

            var subjects = await _bidsContext.BidsSubjects
                .Where(s => s.DatasetId == datasetId)
                .OrderBy(s => s.SubjectId)
                .ToListAsync();

            var subjectDtos = new List<BidsSubjectDto>();

            foreach (var subject in subjects)
            {
                var dto = _mapper.Map<BidsSubjectDto>(subject);
                
                // Get counts
                dto.SessionCount = await _bidsContext.BidsSessions.CountAsync(s => s.SubjectId == subject.Id);
                dto.RecordingCount = await _bidsContext.BidsEegRecordings
                    .CountAsync(r => _bidsContext.BidsSessions.Any(s => s.Id == r.SessionId && s.SubjectId == subject.Id));

                subjectDtos.Add(dto);
            }

            return subjectDtos;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving BIDS subjects for dataset {DatasetId}", datasetId);
            throw;
        }
    }

    #endregion

    #region Session Management

    public async Task<BidsSessionDto> CreateSessionAsync(string subjectId, string userId, BidsSessionDto sessionDto)
    {
        try
        {
            // Verify subject and dataset ownership
            var subject = await _bidsContext.BidsSubjects
                .Include(s => s.Dataset)
                .FirstOrDefaultAsync(s => s.Id == subjectId && s.Dataset!.CreatedBy == userId);

            if (subject == null)
                throw new NotFoundException("Subject not found");

            var session = new BidsSession
            {
                SessionId = sessionDto.SessionId,
                SubjectId = subjectId,
                SessionDate = sessionDto.SessionDate,
                Notes = sessionDto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _bidsContext.BidsSessions.Add(session);
            await _bidsContext.SaveChangesAsync();

            _logger.LogInformation("BIDS session created: {SessionId} for subject {SubjectId}", session.SessionId, subjectId);

            return _mapper.Map<BidsSessionDto>(session);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating BIDS session for subject {SubjectId}", subjectId);
            throw;
        }
    }

    public async Task<List<BidsSessionDto>> GetSubjectSessionsAsync(string subjectId, string userId)
    {
        try
        {
            // Verify subject and dataset ownership
            var subject = await _bidsContext.BidsSubjects
                .Include(s => s.Dataset)
                .FirstOrDefaultAsync(s => s.Id == subjectId && s.Dataset!.CreatedBy == userId);

            if (subject == null)
                throw new NotFoundException("Subject not found");

            var sessions = await _bidsContext.BidsSessions
                .Where(s => s.SubjectId == subjectId)
                .OrderBy(s => s.SessionDate)
                .ToListAsync();

            var sessionDtos = new List<BidsSessionDto>();

            foreach (var session in sessions)
            {
                var dto = _mapper.Map<BidsSessionDto>(session);
                dto.RecordingCount = await _bidsContext.BidsEegRecordings.CountAsync(r => r.SessionId == session.Id);
                sessionDtos.Add(dto);
            }

            return sessionDtos;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving BIDS sessions for subject {SubjectId}", subjectId);
            throw;
        }
    }

    #endregion

    #region Recording Management

    public async Task<BidsEegRecordingDto> UploadBidsRecordingAsync(string userId, BidsUploadRequest uploadRequest)
    {
        try
        {
            // Handle dataset creation or selection
            string datasetId;
            if (!string.IsNullOrEmpty(uploadRequest.DatasetId))
            {
                // Verify dataset ownership
                var existingDataset = await _bidsContext.BidsDatasets
                    .FirstOrDefaultAsync(d => d.Id == uploadRequest.DatasetId && d.CreatedBy == userId);
                
                if (existingDataset == null)
                    throw new NotFoundException("Dataset not found");
                
                datasetId = uploadRequest.DatasetId;
            }
            else
            {
                // Create new dataset
                var newDataset = new BidsDataset
                {
                    Name = uploadRequest.DatasetName ?? $"Dataset_{DateTime.UtcNow:yyyyMMdd}",
                    Description = uploadRequest.DatasetDescription ?? "Auto-generated dataset",
                    CreatedBy = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _bidsContext.BidsDatasets.Add(newDataset);
                await _bidsContext.SaveChangesAsync();
                datasetId = newDataset.Id;
            }

            // Handle subject creation or selection
            var subject = await _bidsContext.BidsSubjects
                .FirstOrDefaultAsync(s => s.DatasetId == datasetId && s.SubjectId == uploadRequest.SubjectId);

            if (subject == null)
            {
                subject = new BidsSubject
                {
                    SubjectId = uploadRequest.SubjectId,
                    DatasetId = datasetId,
                    Demographics = new SubjectDemographics
                    {
                        Age = uploadRequest.Age,
                        Sex = uploadRequest.Sex ?? "",
                        Handedness = uploadRequest.Handedness ?? "",
                        Group = uploadRequest.Group ?? ""
                    },
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _bidsContext.BidsSubjects.Add(subject);
                await _bidsContext.SaveChangesAsync();
            }

            // Handle session creation or selection
            var sessionId = uploadRequest.SessionId ?? "baseline";
            var session = await _bidsContext.BidsSessions
                .FirstOrDefaultAsync(s => s.SubjectId == subject.Id && s.SessionId == sessionId);

            if (session == null)
            {
                session = new BidsSession
                {
                    SessionId = sessionId,
                    SubjectId = subject.Id,
                    SessionDate = uploadRequest.SessionDate ?? DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _bidsContext.BidsSessions.Add(session);
                await _bidsContext.SaveChangesAsync();
            }

            // Process and store the EEG file
            var fileExtension = Path.GetExtension(uploadRequest.File.FileName).ToLowerInvariant();
            var format = GetEegFormatFromExtension(fileExtension);

            // Generate BIDS-compliant filename
            var run = uploadRequest.Run ?? "01";
            var bidsFilename = GenerateBidsFilename(uploadRequest.SubjectId, sessionId, uploadRequest.Task, 
                uploadRequest.Acquisition, run, fileExtension);

            // Store file using GridFS
            string gridFsId;
            using var stream = uploadRequest.File.OpenReadStream();
            var uploadOptions = new GridFSUploadOptions
            {
                Metadata = new MongoDB.Bson.BsonDocument
                {
                    ["originalFilename"] = uploadRequest.File.FileName,
                    ["bidsFilename"] = bidsFilename,
                    ["contentType"] = uploadRequest.File.ContentType,
                    ["uploadedBy"] = userId,
                    ["uploadedAt"] = DateTime.UtcNow
                }
            };

            var objectId = await _gridFsBucket.UploadFromStreamAsync(bidsFilename, stream, uploadOptions);
            gridFsId = objectId.ToString();

            // Create BIDS EEG recording
            var recording = new BidsEegRecording
            {
                SessionId = session.Id,
                UserId = userId,
                Task = uploadRequest.Task,
                Acquisition = uploadRequest.Acquisition ?? "",
                Run = run,
                OriginalFilename = uploadRequest.File.FileName,
                BidsFilename = bidsFilename,
                Format = format,
                Size = uploadRequest.File.Length,
                GridFsId = gridFsId,
                UploadDate = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                RecordingInfo = new EegRecordingInfo
                {
                    TaskName = uploadRequest.Task,
                    Manufacturer = "Unknown",
                    EEGReference = "Unknown"
                }
            };

            _bidsContext.BidsEegRecordings.Add(recording);
            await _bidsContext.SaveChangesAsync();

            _logger.LogInformation("BIDS EEG recording uploaded: {BidsFilename} by user {UserId}", bidsFilename, userId);

            return _mapper.Map<BidsEegRecordingDto>(recording);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading BIDS EEG recording for user {UserId}", userId);
            throw;
        }
    }

    #endregion

    #region BIDS Validation and Export

    public async Task<BidsValidationResult> ValidateDatasetAsync(string datasetId, string userId)
    {
        try
        {
            // Verify dataset ownership
            var dataset = await _bidsContext.BidsDatasets
                .FirstOrDefaultAsync(d => d.Id == datasetId && d.CreatedBy == userId);

            if (dataset == null)
                throw new NotFoundException("Dataset not found");

            var result = new BidsValidationResult { IsValid = true };

            // Validate dataset description
            if (string.IsNullOrEmpty(dataset.Name))
            {
                result.Errors.Add(new BidsValidationError
                {
                    Code = "DATASET_NAME_MISSING",
                    Message = "Dataset name is required",
                    File = "dataset_description.json"
                });
                result.IsValid = false;
            }

            // Validate subjects
            var subjects = await _bidsContext.BidsSubjects
                .Where(s => s.DatasetId == datasetId)
                .ToListAsync();

            if (!subjects.Any())
            {
                result.Warnings.Add(new BidsValidationWarning
                {
                    Code = "NO_SUBJECTS",
                    Message = "Dataset contains no subjects",
                    File = "participants.tsv"
                });
            }

            foreach (var subject in subjects)
            {
                // Validate subject ID format
                if (!IsValidBidsId(subject.SubjectId))
                {
                    result.Errors.Add(new BidsValidationError
                    {
                        Code = "INVALID_SUBJECT_ID",
                        Message = $"Invalid subject ID format: {subject.SubjectId}",
                        File = $"sub-{subject.SubjectId}"
                    });
                    result.IsValid = false;
                }

                // Validate sessions
                var sessions = await _bidsContext.BidsSessions
                    .Where(s => s.SubjectId == subject.Id)
                    .ToListAsync();

                foreach (var session in sessions)
                {
                    if (!IsValidBidsId(session.SessionId))
                    {
                        result.Errors.Add(new BidsValidationError
                        {
                            Code = "INVALID_SESSION_ID",
                            Message = $"Invalid session ID format: {session.SessionId}",
                            File = $"sub-{subject.SubjectId}/ses-{session.SessionId}"
                        });
                        result.IsValid = false;
                    }

                    // Validate recordings
                    var recordings = await _bidsContext.BidsEegRecordings
                        .Where(r => r.SessionId == session.Id)
                        .ToListAsync();

                    foreach (var recording in recordings)
                    {
                        if (string.IsNullOrEmpty(recording.Task))
                        {
                            result.Errors.Add(new BidsValidationError
                            {
                                Code = "MISSING_TASK",
                                Message = "Task is required for EEG recordings",
                                File = recording.BidsFilename
                            });
                            result.IsValid = false;
                        }

                        if (recording.RecordingInfo.SamplingFrequency <= 0)
                        {
                            result.Errors.Add(new BidsValidationError
                            {
                                Code = "INVALID_SAMPLING_FREQUENCY",
                                Message = "Sampling frequency must be greater than 0",
                                File = recording.BidsFilename
                            });
                            result.IsValid = false;
                        }
                    }
                }
            }

            // Generate summary
            result.Summary = new BidsValidationSummary
            {
                TotalFiles = await _bidsContext.BidsEegRecordings
                    .CountAsync(r => _bidsContext.BidsSessions
                        .Any(s => s.Id == r.SessionId && 
                                 _bidsContext.BidsSubjects.Any(sub => sub.Id == s.SubjectId && sub.DatasetId == datasetId))),
                ValidFiles = result.IsValid ? result.Summary.TotalFiles : result.Summary.TotalFiles - result.Errors.Count,
                ErrorCount = result.Errors.Count,
                WarningCount = result.Warnings.Count,
                ValidatedAt = DateTime.UtcNow
            };

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating BIDS dataset {DatasetId}", datasetId);
            throw;
        }
    }

    public async Task<Stream> ExportBidsDatasetAsync(string datasetId, string userId)
    {
        try
        {
            // Verify dataset ownership
            var dataset = await _bidsContext.BidsDatasets
                .FirstOrDefaultAsync(d => d.Id == datasetId && d.CreatedBy == userId);

            if (dataset == null)
                throw new NotFoundException("Dataset not found");

            var memoryStream = new MemoryStream();
            using var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true);

            // Add dataset_description.json
            var datasetDescription = await GenerateDatasetDescriptionAsync(datasetId);
            var datasetDescEntry = archive.CreateEntry("dataset_description.json");
            using (var entryStream = datasetDescEntry.Open())
            {
                var json = JsonSerializer.Serialize(datasetDescription, new JsonSerializerOptions { WriteIndented = true });
                var bytes = Encoding.UTF8.GetBytes(json);
                await entryStream.WriteAsync(bytes);
            }

            // Add participants.tsv
            var participantsData = await GenerateParticipantsTsvAsync(datasetId);
            var participantsEntry = archive.CreateEntry("participants.tsv");
            using (var entryStream = participantsEntry.Open())
            {
                var tsv = GenerateTsvContent(participantsData);
                var bytes = Encoding.UTF8.GetBytes(tsv);
                await entryStream.WriteAsync(bytes);
            }

            // Add EEG files and metadata
            var subjects = await _bidsContext.BidsSubjects
                .Where(s => s.DatasetId == datasetId)
                .Include(s => s.Sessions)
                .ThenInclude(ses => ses.EegRecordings)
                .ToListAsync();

            foreach (var subject in subjects)
            {
                foreach (var session in subject.Sessions)
                {
                    foreach (var recording in session.EegRecordings)
                    {
                        if (!string.IsNullOrEmpty(recording.GridFsId))
                        {
                            // Add EEG data file
                            var fileStream = await _gridFsBucket.OpenDownloadStreamAsync(
                                MongoDB.Bson.ObjectId.Parse(recording.GridFsId));
                            
                            var filePath = $"sub-{subject.SubjectId}/";
                            if (!string.IsNullOrEmpty(session.SessionId))
                            {
                                filePath += $"ses-{session.SessionId}/";
                            }
                            filePath += $"eeg/{recording.BidsFilename}";

                            var fileEntry = archive.CreateEntry(filePath);
                            using var entryStream = fileEntry.Open();
                            await fileStream.CopyToAsync(entryStream);
                        }
                    }
                }
            }

            memoryStream.Position = 0;
            return memoryStream;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting BIDS dataset {DatasetId}", datasetId);
            throw;
        }
    }

    #endregion

    #region Search and Statistics

    public async Task<List<BidsEegRecordingDto>> SearchRecordingsAsync(string userId, BidsSearchParams searchParams)
    {
        try
        {
            var query = _bidsContext.BidsEegRecordings.AsQueryable();

            // Filter by user's datasets
            query = query.Where(r => _bidsContext.BidsSessions
                .Any(s => s.Id == r.SessionId && 
                         _bidsContext.BidsSubjects.Any(sub => sub.Id == s.SubjectId && 
                                                             _bidsContext.BidsDatasets.Any(d => d.Id == sub.DatasetId && d.CreatedBy == userId))));

            // Apply filters
            if (!string.IsNullOrEmpty(searchParams.DatasetId))
            {
                query = query.Where(r => _bidsContext.BidsSessions
                    .Any(s => s.Id == r.SessionId && 
                             _bidsContext.BidsSubjects.Any(sub => sub.Id == s.SubjectId && sub.DatasetId == searchParams.DatasetId)));
            }

            if (!string.IsNullOrEmpty(searchParams.Task))
            {
                query = query.Where(r => r.Task.Contains(searchParams.Task));
            }

            if (searchParams.Format.HasValue)
            {
                query = query.Where(r => r.Format == searchParams.Format.Value);
            }

            if (searchParams.FromDate.HasValue)
            {
                query = query.Where(r => r.UploadDate >= searchParams.FromDate.Value);
            }

            if (searchParams.ToDate.HasValue)
            {
                query = query.Where(r => r.UploadDate <= searchParams.ToDate.Value);
            }

            // Pagination
            var skip = (searchParams.Page - 1) * searchParams.PageSize;
            var recordings = await query
                .OrderByDescending(r => r.UploadDate)
                .Skip(skip)
                .Take(searchParams.PageSize)
                .ToListAsync();

            return _mapper.Map<List<BidsEegRecordingDto>>(recordings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching BIDS recordings for user {UserId}", userId);
            throw;
        }
    }

    public async Task<BidsDatasetStatistics> GetDatasetStatisticsAsync(string datasetId, string userId)
    {
        try
        {
            var dataset = await _bidsContext.BidsDatasets
                .FirstOrDefaultAsync(d => d.Id == datasetId && d.CreatedBy == userId);

            if (dataset == null)
                throw new NotFoundException("Dataset not found");

            var stats = new BidsDatasetStatistics
            {
                DatasetId = datasetId,
                DatasetName = dataset.Name
            };

            // Get basic counts
            stats.SubjectCount = await _bidsContext.BidsSubjects.CountAsync(s => s.DatasetId == datasetId);
            stats.SessionCount = await _bidsContext.BidsSessions
                .CountAsync(s => _bidsContext.BidsSubjects.Any(sub => sub.Id == s.SubjectId && sub.DatasetId == datasetId));
            stats.RecordingCount = await _bidsContext.BidsEegRecordings
                .CountAsync(r => _bidsContext.BidsSessions
                    .Any(s => s.Id == r.SessionId && 
                             _bidsContext.BidsSubjects.Any(sub => sub.Id == s.SubjectId && sub.DatasetId == datasetId)));

            // Get task counts
            var taskCounts = await _bidsContext.BidsEegRecordings
                .Where(r => _bidsContext.BidsSessions
                    .Any(s => s.Id == r.SessionId && 
                             _bidsContext.BidsSubjects.Any(sub => sub.Id == s.SubjectId && sub.DatasetId == datasetId)))
                .GroupBy(r => r.Task)
                .Select(g => new { Task = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Task, x => x.Count);

            stats.TaskCounts = taskCounts;

            return stats;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting statistics for BIDS dataset {DatasetId}", datasetId);
            throw;
        }
    }

    #endregion

    #region Helper Methods

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

    private static string GenerateBidsFilename(string subjectId, string sessionId, string task, 
        string? acquisition, string run, string extension)
    {
        var filename = $"sub-{subjectId}";
        
        if (!string.IsNullOrEmpty(sessionId))
            filename += $"_ses-{sessionId}";
        
        filename += $"_task-{task}";
        
        if (!string.IsNullOrEmpty(acquisition))
            filename += $"_acq-{acquisition}";
        
        filename += $"_run-{run}_eeg{extension}";

        return filename;
    }

    private static bool IsValidBidsId(string id)
    {
        return !string.IsNullOrEmpty(id) && System.Text.RegularExpressions.Regex.IsMatch(id, @"^[a-zA-Z0-9]+$");
    }

    public async Task<Dictionary<string, object>> GenerateDatasetDescriptionAsync(string datasetId)
    {
        var dataset = await _bidsContext.BidsDatasets.FindAsync(datasetId);
        
        return new Dictionary<string, object>
        {
            ["Name"] = dataset?.Name ?? "",
            ["BIDSVersion"] = dataset?.BidsVersion ?? "1.8.0",
            ["DatasetType"] = "raw",
            ["Authors"] = dataset?.Authors ?? new List<string>(),
            ["Description"] = dataset?.Description ?? "",
            ["License"] = dataset?.License ?? "",
            ["ReferencesAndLinks"] = dataset?.ReferencesAndLinks ?? new List<string>()
        };
    }

    public async Task<List<Dictionary<string, object>>> GenerateParticipantsTsvAsync(string datasetId)
    {
        var subjects = await _bidsContext.BidsSubjects
            .Where(s => s.DatasetId == datasetId)
            .ToListAsync();

        return subjects.Select(s => new Dictionary<string, object>
        {
            ["participant_id"] = $"sub-{s.SubjectId}",
            ["age"] = s.Demographics.Age ?? 0,
            ["sex"] = s.Demographics.Sex,
            ["group"] = s.Demographics.Group,
            ["handedness"] = s.Demographics.Handedness
        }).ToList();
    }

    private static string GenerateTsvContent(List<Dictionary<string, object>> data)
    {
        if (!data.Any()) return "";

        var headers = data[0].Keys.ToList();
        var sb = new StringBuilder();
        
        // Add headers
        sb.AppendLine(string.Join("\t", headers));
        
        // Add data rows
        foreach (var row in data)
        {
            var values = headers.Select(h => row.ContainsKey(h) ? row[h]?.ToString() ?? "" : "");
            sb.AppendLine(string.Join("\t", values));
        }

        return sb.ToString();
    }

    // Placeholder implementations for interface completeness
    public Task<BidsSubjectDto?> GetSubjectByIdAsync(string subjectId, string userId) => throw new NotImplementedException();
    public Task<BidsSubjectDto> UpdateSubjectAsync(string subjectId, string userId, BidsSubjectDto subjectDto) => throw new NotImplementedException();
    public Task<bool> DeleteSubjectAsync(string subjectId, string userId) => throw new NotImplementedException();
    public Task<BidsSessionDto?> GetSessionByIdAsync(string sessionId, string userId) => throw new NotImplementedException();
    public Task<BidsSessionDto> UpdateSessionAsync(string sessionId, string userId, BidsSessionDto sessionDto) => throw new NotImplementedException();
    public Task<bool> DeleteSessionAsync(string sessionId, string userId) => throw new NotImplementedException();
    public Task<List<BidsEegRecordingDto>> GetSessionRecordingsAsync(string sessionId, string userId) => throw new NotImplementedException();
    public Task<BidsEegRecordingDto?> GetRecordingByIdAsync(string recordingId, string userId) => throw new NotImplementedException();
    public Task<BidsEegRecordingDto> UpdateRecordingAsync(string recordingId, string userId, BidsEegRecordingDto recordingDto) => throw new NotImplementedException();
    public Task<bool> DeleteRecordingAsync(string recordingId, string userId) => throw new NotImplementedException();
    public Task<List<BidsSubjectDto>> SearchSubjectsAsync(string userId, SubjectSearchParams searchParams) => throw new NotImplementedException();
    public Task<List<BidsDatasetStatistics>> GetUserStatisticsAsync(string userId) => throw new NotImplementedException();

    #endregion
}