using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace EegilityApi.Models;

// BIDS Dataset Root
public class BidsDataset
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public List<string> Authors { get; set; } = new();

    public string DatasetVersion { get; set; } = "1.0.0";

    public string License { get; set; } = string.Empty;

    public List<string> ReferencesAndLinks { get; set; } = new();

    public string BidsVersion { get; set; } = "1.8.0";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [BsonRepresentation(BsonType.ObjectId)]
    public string CreatedBy { get; set; } = string.Empty;

    // Navigation
    public virtual ICollection<BidsSubject> Subjects { get; set; } = new List<BidsSubject>();
}

// BIDS Subject
public class BidsSubject
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string SubjectId { get; set; } = string.Empty; // sub-01, sub-02, etc.

    [BsonRepresentation(BsonType.ObjectId)]
    public string DatasetId { get; set; } = string.Empty;

    public SubjectDemographics Demographics { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual BidsDataset? Dataset { get; set; }
    public virtual ICollection<BidsSession> Sessions { get; set; } = new List<BidsSession>();
}

// BIDS Session
public class BidsSession
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string SessionId { get; set; } = string.Empty; // ses-baseline, ses-followup, etc.

    [BsonRepresentation(BsonType.ObjectId)]
    public string SubjectId { get; set; } = string.Empty;

    public DateTime SessionDate { get; set; } = DateTime.UtcNow;

    public string Notes { get; set; } = string.Empty;

    public Dictionary<string, object> Metadata { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual BidsSubject? Subject { get; set; }
    public virtual ICollection<BidsEegRecording> EegRecordings { get; set; } = new List<BidsEegRecording>();
}

// BIDS EEG Recording (replaces the basic EegData for BIDS compliance)
public class BidsEegRecording
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string SessionId { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty; // User who uploaded

    // BIDS filename components
    public string Task { get; set; } = string.Empty; // task-rest, task-oddball, etc.
    public string Acquisition { get; set; } = string.Empty; // acq-highres, acq-standard, etc.
    public string Run { get; set; } = "01"; // run-01, run-02, etc.
    public string Processing { get; set; } = string.Empty; // proc-clean, proc-raw, etc.
    public string Recording { get; set; } = "eeg"; // recording type

    // File information
    public string OriginalFilename { get; set; } = string.Empty;
    public string BidsFilename { get; set; } = string.Empty; // Generated BIDS-compliant filename
    public EegFormat Format { get; set; }
    public long Size { get; set; }

    // EEG-specific metadata (required by BIDS)
    public EegRecordingInfo RecordingInfo { get; set; } = new();

    // Channel information
    public List<EegChannel> Channels { get; set; } = new();

    // Events/triggers
    public List<EegEvent> Events { get; set; } = new();

    // File storage
    [BsonRepresentation(BsonType.ObjectId)]
    public string? GridFsId { get; set; }

    public string? DataUrl { get; set; }

    // Analysis results
    public AdhdAnalysis? AdhdAnalysis { get; set; }

    // Quality metrics
    public QualityMetrics? QualityMetrics { get; set; }

    public DateTime UploadDate { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual BidsSession? Session { get; set; }
    public virtual User? User { get; set; }
}

// Subject Demographics (BIDS participants.tsv)
public class SubjectDemographics
{
    public int? Age { get; set; }
    public string Sex { get; set; } = string.Empty; // M, F, O
    public string Handedness { get; set; } = string.Empty; // R, L, A (ambidextrous)
    public string Group { get; set; } = string.Empty; // control, patient, etc.
    public List<string> Diagnosis { get; set; } = new();
    public List<string> Medications { get; set; } = new();
    public string Education { get; set; } = string.Empty;
    public double? Height { get; set; } // in cm
    public double? Weight { get; set; } // in kg
    public Dictionary<string, object> CustomFields { get; set; } = new();
}

// EEG Recording Information (BIDS *_eeg.json)
public class EegRecordingInfo
{
    [Required]
    public double SamplingFrequency { get; set; } // Hz

    [Required]
    public int EEGChannelCount { get; set; }

    public int? EOGChannelCount { get; set; }
    public int? ECGChannelCount { get; set; }
    public int? EMGChannelCount { get; set; }
    public int? MiscChannelCount { get; set; }
    public int? TriggerChannelCount { get; set; }

    public double? RecordingDuration { get; set; } // seconds

    [Required]
    public string EEGReference { get; set; } = string.Empty; // average, linked-mastoids, etc.

    public double? PowerLineFrequency { get; set; } = 50; // Hz (50 or 60)

    public string EEGGround { get; set; } = string.Empty;

    public string Manufacturer { get; set; } = string.Empty;
    public string ManufacturersModelName { get; set; } = string.Empty;
    public string SoftwareVersions { get; set; } = string.Empty;

    public Dictionary<string, double> DigitalFilter { get; set; } = new();
    public Dictionary<string, double> HardwareFilter { get; set; } = new();

    public string SubjectArtefactDescription { get; set; } = string.Empty;

    public DateTime? RecordingTime { get; set; }

    public string TaskName { get; set; } = string.Empty;
    public string TaskDescription { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;

    public Dictionary<string, object> CustomFields { get; set; } = new();
}

// EEG Channel Information (BIDS *_channels.tsv)
public class EegChannel
{
    [Required]
    public string Name { get; set; } = string.Empty; // Fp1, Fp2, etc.

    [Required]
    public string Type { get; set; } = string.Empty; // EEG, EOG, ECG, EMG, MISC, TRIG

    [Required]
    public string Units { get; set; } = "µV"; // Microvolts

    public double? SamplingFrequency { get; set; }

    public double? LowCutoff { get; set; } // High-pass filter
    public double? HighCutoff { get; set; } // Low-pass filter

    public string Reference { get; set; } = string.Empty;

    public string Group { get; set; } = string.Empty; // scalp, seeg, ecog, etc.

    public string Description { get; set; } = string.Empty;

    public string StatusDescription { get; set; } = "good"; // good, bad

    // Electrode position information
    public ElectrodePosition? Position { get; set; }

    public Dictionary<string, object> CustomFields { get; set; } = new();
}

// Electrode Position Information
public class ElectrodePosition
{
    public double? X { get; set; } // mm
    public double? Y { get; set; } // mm
    public double? Z { get; set; } // mm

    public string CoordinateSystem { get; set; } = "CapTrak"; // CapTrak, CTF, etc.
    public string CoordinateUnits { get; set; } = "mm";

    public Dictionary<string, object> Fiducials { get; set; } = new();
}

// EEG Events (BIDS *_events.tsv)
public class EegEvent
{
    [Required]
    public double Onset { get; set; } // seconds from recording start

    [Required]
    public double Duration { get; set; } // seconds

    public string? TrialType { get; set; } = string.Empty;

    public string? Value { get; set; } = string.Empty; // trigger value

    public double? SampleNumber { get; set; }

    public string? Response { get; set; } = string.Empty;

    public double? ResponseTime { get; set; } // seconds

    public string? HED { get; set; } = string.Empty; // Hierarchical Event Descriptors

    public Dictionary<string, object> CustomFields { get; set; } = new();
}

// Quality Metrics
public class QualityMetrics
{
    public double? SignalToNoiseRatio { get; set; }
    public double? AverageAmplitude { get; set; }
    public double? MaxAmplitude { get; set; }
    public double? MinAmplitude { get; set; }
    
    public List<string> BadChannels { get; set; } = new();
    public List<ArtifactInfo> Artifacts { get; set; } = new();
    
    public double? DataQualityScore { get; set; } // 0-100
    public string QualityAssessment { get; set; } = string.Empty; // excellent, good, fair, poor

    public DateTime AssessedAt { get; set; } = DateTime.UtcNow;
    public string AssessedBy { get; set; } = string.Empty; // automated, manual
}

public class ArtifactInfo
{
    public string Type { get; set; } = string.Empty; // blink, muscle, movement, etc.
    public double StartTime { get; set; } // seconds
    public double EndTime { get; set; } // seconds
    public List<string> AffectedChannels { get; set; } = new();
    public double Severity { get; set; } // 0-1
}

// BIDS-specific DTOs
public class BidsDatasetDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Authors { get; set; } = new();
    public string DatasetVersion { get; set; } = string.Empty;
    public string License { get; set; } = string.Empty;
    public string BidsVersion { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int SubjectCount { get; set; }
    public int SessionCount { get; set; }
    public int RecordingCount { get; set; }
}

public class BidsSubjectDto
{
    public string Id { get; set; } = string.Empty;
    public string SubjectId { get; set; } = string.Empty;
    public SubjectDemographics Demographics { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public int SessionCount { get; set; }
    public int RecordingCount { get; set; }
}

public class BidsSessionDto
{
    public string Id { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
    public DateTime SessionDate { get; set; }
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int RecordingCount { get; set; }
}

public class BidsEegRecordingDto
{
    public string Id { get; set; } = string.Empty;
    public string BidsFilename { get; set; } = string.Empty;
    public string Task { get; set; } = string.Empty;
    public string Acquisition { get; set; } = string.Empty;
    public string Run { get; set; } = string.Empty;
    public EegFormat Format { get; set; }
    public long Size { get; set; }
    public EegRecordingInfo RecordingInfo { get; set; } = new();
    public int ChannelCount { get; set; }
    public int EventCount { get; set; }
    public QualityMetrics? QualityMetrics { get; set; }
    public AdhdAnalysis? AdhdAnalysis { get; set; }
    public DateTime UploadDate { get; set; }
}

public class BidsUploadRequest
{
    [Required]
    public IFormFile File { get; set; } = null!;

    // Dataset information
    public string? DatasetId { get; set; }
    public string? DatasetName { get; set; }
    public string? DatasetDescription { get; set; }

    // Subject information
    [Required]
    public string SubjectId { get; set; } = string.Empty;
    public int? Age { get; set; }
    public string? Sex { get; set; }
    public string? Handedness { get; set; }
    public string? Group { get; set; }

    // Session information
    public string? SessionId { get; set; }
    public DateTime? SessionDate { get; set; }

    // Recording information
    [Required]
    public string Task { get; set; } = string.Empty;
    public string? Acquisition { get; set; }
    public string? Run { get; set; }

    // Additional metadata
    public string? Notes { get; set; }
    public List<string>? Tags { get; set; }
}