using EegilityApi.Models;

namespace EegilityApi.Services;

public interface IDeviceService
{
    // Device Discovery and Connection
    Task<List<EegDevice>> DiscoverDevicesAsync();
    Task<DeviceConnectionResult> ConnectDeviceAsync(string deviceId, DeviceConnectionParams parameters);
    Task<bool> DisconnectDeviceAsync(string deviceId);
    Task<List<EegDevice>> GetConnectedDevicesAsync(string userId);
    
    // Device Configuration
    Task<DeviceConfiguration> GetDeviceConfigurationAsync(string deviceId);
    Task<bool> UpdateDeviceConfigurationAsync(string deviceId, DeviceConfiguration configuration);
    Task<List<DeviceCapabilities>> GetDeviceCapabilitiesAsync(string deviceType);
    
    // Data Streaming
    Task<bool> StartStreamingAsync(string deviceId, StreamingConfiguration config);
    Task<bool> StopStreamingAsync(string deviceId);
    Task<StreamingStatus> GetStreamingStatusAsync(string deviceId);
    
    // Data Recording
    Task<string> StartRecordingAsync(string deviceId, RecordingConfiguration config);
    Task<bool> StopRecordingAsync(string recordingId);
    Task<RecordingStatus> GetRecordingStatusAsync(string recordingId);
    
    // Device Health and Monitoring
    Task<DeviceHealth> GetDeviceHealthAsync(string deviceId);
    Task<SignalQuality> GetSignalQualityAsync(string deviceId);
    Task<List<DeviceEvent>> GetDeviceEventsAsync(string deviceId, DateTime? fromDate = null);
    
    // Calibration and Testing
    Task<CalibrationResult> CalibrateDeviceAsync(string deviceId, CalibrationType type);
    Task<ImpedanceTestResult> RunImpedanceTestAsync(string deviceId);
    Task<bool> SendTestSignalAsync(string deviceId, TestSignalType signalType);
}

// Device Models
public class EegDevice
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DeviceType Type { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public string FirmwareVersion { get; set; } = string.Empty;
    public string HardwareVersion { get; set; } = string.Empty;
    public DeviceStatus Status { get; set; }
    public DateTime? LastSeen { get; set; }
    public DeviceConnectionInfo? ConnectionInfo { get; set; }
    public DeviceCapabilities? Capabilities { get; set; }
    public string ConnectedUserId { get; set; } = string.Empty;
    public DateTime? ConnectedAt { get; set; }
}

public enum DeviceType
{
    OpenBCICyton,      // OpenBCI Cyton (8-channel)
    OpenBCIDaisy,      // OpenBCI Cyton + Daisy (16-channel)
    OpenBCIGanglion,   // OpenBCI Ganglion (4-channel)
    HospitalSystem,    // Generic hospital EEG system
    SimulatedDevice    // For testing/development
}

public enum DeviceStatus
{
    Disconnected,
    Connecting,
    Connected,
    Streaming,
    Recording,
    Error,
    Calibrating
}

public class DeviceConnectionInfo
{
    public string ConnectionType { get; set; } = string.Empty; // USB, Bluetooth, WiFi, Serial
    public string Port { get; set; } = string.Empty;
    public int BaudRate { get; set; }
    public string MacAddress { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public int SignalStrength { get; set; } // For wireless connections
}

public class DeviceCapabilities
{
    public int MaxChannels { get; set; }
    public List<int> SupportedSampleRates { get; set; } = new();
    public List<string> SupportedGains { get; set; } = new();
    public bool SupportsImpedanceTest { get; set; }
    public bool SupportsAccelerometer { get; set; }
    public bool SupportsAnalogInputs { get; set; }
    public bool SupportsDigitalInputs { get; set; }
    public List<string> SupportedFilters { get; set; } = new();
    public double BatteryVoltageMin { get; set; }
    public double BatteryVoltageMax { get; set; }
}

public class DeviceConnectionParams
{
    public string ConnectionType { get; set; } = string.Empty;
    public string Port { get; set; } = string.Empty;
    public int BaudRate { get; set; } = 115200;
    public Dictionary<string, object> AdditionalParams { get; set; } = new();
}

public class DeviceConnectionResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public EegDevice? Device { get; set; }
    public string? ErrorCode { get; set; }
}

public class DeviceConfiguration
{
    public string DeviceId { get; set; } = string.Empty;
    public int SampleRate { get; set; } = 250;
    public List<ChannelConfiguration> Channels { get; set; } = new();
    public FilterConfiguration Filters { get; set; } = new();
    public bool AccelerometerEnabled { get; set; }
    public Dictionary<string, object> CustomSettings { get; set; } = new();
}

public class ChannelConfiguration
{
    public int ChannelNumber { get; set; }
    public bool Enabled { get; set; } = true;
    public string Name { get; set; } = string.Empty;
    public string Gain { get; set; } = "24x";
    public string InputType { get; set; } = "Normal"; // Normal, Shorted, BIAS_MEAS, MVDD, Temp, Test
    public bool BiasEnabled { get; set; } = true;
    public bool SrpEnabled { get; set; } = true;
}

public class FilterConfiguration
{
    public bool HighPassEnabled { get; set; }
    public double HighPassCutoff { get; set; } = 1.0;
    public bool LowPassEnabled { get; set; }
    public double LowPassCutoff { get; set; } = 50.0;
    public bool NotchEnabled { get; set; }
    public double NotchFrequency { get; set; } = 60.0;
}

public class StreamingConfiguration
{
    public string UserId { get; set; } = string.Empty;
    public bool SaveToFile { get; set; }
    public string? FileName { get; set; }
    public List<string> StreamingTargets { get; set; } = new(); // WebSocket, TCP, UDP endpoints
    public int BufferSize { get; set; } = 1000;
    public bool EnableCompression { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class StreamingStatus
{
    public string DeviceId { get; set; } = string.Empty;
    public bool IsStreaming { get; set; }
    public DateTime? StartedAt { get; set; }
    public long SamplesReceived { get; set; }
    public long BytesReceived { get; set; }
    public double SampleRate { get; set; }
    public int DroppedSamples { get; set; }
    public double BufferFillLevel { get; set; } // 0-1
    public List<string> ActiveTargets { get; set; } = new();
}

public class RecordingConfiguration
{
    public string UserId { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string Format { get; set; } = "EDF"; // EDF, BDF, CSV
    public TimeSpan? MaxDuration { get; set; }
    public long? MaxFileSize { get; set; }
    public bool AutoSplit { get; set; }
    public Dictionary<string, object> SubjectMetadata { get; set; } = new();
    public Dictionary<string, object> SessionMetadata { get; set; } = new();
}

public class RecordingStatus
{
    public string RecordingId { get; set; } = string.Empty;
    public string DeviceId { get; set; } = string.Empty;
    public bool IsRecording { get; set; }
    public DateTime? StartedAt { get; set; }
    public TimeSpan Duration { get; set; }
    public long SamplesRecorded { get; set; }
    public long FileSize { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public double Progress { get; set; } // 0-1 for timed recordings
}

public class DeviceHealth
{
    public string DeviceId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public double? BatteryVoltage { get; set; }
    public int? BatteryPercentage { get; set; }
    public double? Temperature { get; set; }
    public bool IsCharging { get; set; }
    public List<ChannelHealth> ChannelHealth { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}

public class ChannelHealth
{
    public int ChannelNumber { get; set; }
    public double? ImpedanceValue { get; set; }
    public ImpedanceLevel ImpedanceLevel { get; set; }
    public bool IsConnected { get; set; }
    public double? SignalStrength { get; set; }
    public double? NoiseLevel { get; set; }
}

public enum ImpedanceLevel
{
    Good,       // < 5 kOhm
    Fair,       // 5-25 kOhm
    Poor,       // 25-100 kOhm
    Bad,        // > 100 kOhm
    NotTested
}

public class SignalQuality
{
    public string DeviceId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public double OverallQuality { get; set; } // 0-1
    public List<ChannelQuality> ChannelQualities { get; set; } = new();
    public double SignalToNoiseRatio { get; set; }
    public double ArtifactLevel { get; set; }
    public List<string> QualityIssues { get; set; } = new();
}

public class ChannelQuality
{
    public int ChannelNumber { get; set; }
    public double Quality { get; set; } // 0-1
    public double SignalAmplitude { get; set; }
    public double NoiseLevel { get; set; }
    public bool HasArtifacts { get; set; }
    public List<string> Issues { get; set; } = new();
}

public class DeviceEvent
{
    public string Id { get; set; } = string.Empty;
    public string DeviceId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public DeviceEventType Type { get; set; }
    public string Message { get; set; } = string.Empty;
    public Dictionary<string, object> Data { get; set; } = new();
    public EventSeverity Severity { get; set; }
}

public enum DeviceEventType
{
    Connected,
    Disconnected,
    StreamingStarted,
    StreamingStopped,
    RecordingStarted,
    RecordingStopped,
    ConfigurationChanged,
    ErrorOccurred,
    BatteryLow,
    SignalQualityChanged,
    CalibrationCompleted,
    ImpedanceTestCompleted
}

public enum EventSeverity
{
    Info,
    Warning,
    Error,
    Critical
}

public class CalibrationResult
{
    public string DeviceId { get; set; } = string.Empty;
    public CalibrationType Type { get; set; }
    public bool Success { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    public List<ChannelCalibration> ChannelResults { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}

public enum CalibrationType
{
    OffsetCalibration,
    GainCalibration,
    ImpedanceCalibration,
    FullCalibration
}

public class ChannelCalibration
{
    public int ChannelNumber { get; set; }
    public bool Success { get; set; }
    public double OffsetValue { get; set; }
    public double GainValue { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class ImpedanceTestResult
{
    public string DeviceId { get; set; } = string.Empty;
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    public bool Success { get; set; }
    public List<ChannelImpedance> ChannelResults { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}

public class ChannelImpedance
{
    public int ChannelNumber { get; set; }
    public double ImpedanceValue { get; set; } // in kOhms
    public ImpedanceLevel Level { get; set; }
    public bool IsAcceptable { get; set; }
}

public enum TestSignalType
{
    SquareWave,
    SineWave,
    DC,
    Ground
}