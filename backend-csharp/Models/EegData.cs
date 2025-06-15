using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace EegilityApi.Models;

public class EegData
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public string Filename { get; set; } = string.Empty;

    [Required]
    public string OriginalFilename { get; set; } = string.Empty;

    [Required]
    public EegFormat Format { get; set; }

    [Required]
    public long Size { get; set; }

    public DateTime UploadDate { get; set; } = DateTime.UtcNow;

    public EegMetadata Metadata { get; set; } = new();

    public bool BidsCompliant { get; set; } = false;

    public List<string> Tags { get; set; } = new();

    public string Notes { get; set; } = string.Empty;

    public AdhdAnalysis? AdhdAnalysis { get; set; }

    public string? DataUrl { get; set; }

    // For GridFS reference (for larger files)
    [BsonRepresentation(BsonType.ObjectId)]
    public string? GridFsId { get; set; }

    // BIDS-specific fields
    public BidsMetadata BidsData { get; set; } = new();

    // Navigation property
    public virtual User? User { get; set; }
}

public enum EegFormat
{
    Edf,
    Bdf,
    Vhdr,
    Set,
    Fif,
    Cnt,
    Npy
}

public class EegMetadata
{
    public SubjectMetadata Subject { get; set; } = new();
    public string Session { get; set; } = string.Empty;
    public string Task { get; set; } = string.Empty;
    public string Acquisition { get; set; } = string.Empty;
    public int Channels { get; set; }
    public double SampleRate { get; set; }
    public double Duration { get; set; }
    public Dictionary<string, object> CustomFields { get; set; } = new();
}

public class SubjectMetadata
{
    public string Id { get; set; } = string.Empty;
    public int? Age { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string Group { get; set; } = string.Empty;
    public string Handedness { get; set; } = string.Empty;
    public List<string> Medications { get; set; } = new();
    public string Diagnosis { get; set; } = string.Empty;
}

public class BidsMetadata
{
    public string Subject { get; set; } = string.Empty;
    public string Session { get; set; } = string.Empty;
    public string Task { get; set; } = string.Empty;
    public string Acquisition { get; set; } = string.Empty;
    public string Run { get; set; } = string.Empty;
    public string Recording { get; set; } = string.Empty;
    public Dictionary<string, object> Participants { get; set; } = new();
    public Dictionary<string, object> TaskMetadata { get; set; } = new();
}

public class AdhdAnalysis
{
    public bool Requested { get; set; } = false;
    public bool Performed { get; set; } = false;
    public bool InProgress { get; set; } = false;
    public string Result { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public DateTime? PerformedAt { get; set; }
    public string? Error { get; set; }
    public AdhdAnalysisDetails? Details { get; set; }
}

public class AdhdAnalysisDetails
{
    public Dictionary<string, double> Probabilities { get; set; } = new();
    public List<string> FeaturesUsed { get; set; } = new();
    public KeyFeatures KeyFeatures { get; set; } = new();
    public string ModelVersion { get; set; } = string.Empty;
}

public class KeyFeatures
{
    public double? ThetaBetaRatio { get; set; }
    public double? FrontalTheta { get; set; }
    public double? CentralBeta { get; set; }
    public double? AlphaActivity { get; set; }
    public Dictionary<string, double> AdditionalFeatures { get; set; } = new();
}

// DTOs
public class EegUploadDto
{
    [Required]
    public IFormFile File { get; set; } = null!;

    public string Notes { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    
    // Subject metadata
    public string SubjectId { get; set; } = string.Empty;
    public int? SubjectAge { get; set; }
    public string SubjectGender { get; set; } = string.Empty;
    public string SubjectGroup { get; set; } = string.Empty;
    
    // Session metadata
    public string Session { get; set; } = string.Empty;
    public string Task { get; set; } = string.Empty;
    public string Acquisition { get; set; } = string.Empty;
}

public class EegDataResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Filename { get; set; } = string.Empty;
    public string OriginalFilename { get; set; } = string.Empty;
    public string Format { get; set; } = string.Empty;
    public long Size { get; set; }
    public DateTime UploadDate { get; set; }
    public EegMetadata Metadata { get; set; } = new();
    public bool BidsCompliant { get; set; }
    public List<string> Tags { get; set; } = new();
    public string Notes { get; set; } = string.Empty;
    public AdhdAnalysis? AdhdAnalysis { get; set; }
    public string? DataUrl { get; set; }
}

public class AdhdAnalysisRequestDto
{
    [Required]
    public string EegDataId { get; set; } = string.Empty;
}