using EegilityApi.Models;
using Microsoft.Extensions.Logging;
using System.IO.Ports;
using System.Text;
using System.Text.Json;
using System.Collections.Concurrent;

namespace EegilityApi.Services;

public class OpenBCIDeviceService : IDeviceService
{
    private readonly ILogger<OpenBCIDeviceService> _logger;
    private readonly ConcurrentDictionary<string, EegDevice> _connectedDevices = new();
    private readonly ConcurrentDictionary<string, SerialPort> _serialPorts = new();
    private readonly ConcurrentDictionary<string, StreamingSession> _streamingSessions = new();
    private readonly ConcurrentDictionary<string, RecordingSession> _recordingSessions = new();

    public OpenBCIDeviceService(ILogger<OpenBCIDeviceService> logger)
    {
        _logger = logger;
    }

    #region Device Discovery and Connection

    public async Task<List<EegDevice>> DiscoverDevicesAsync()
    {
        try
        {
            var devices = new List<EegDevice>();
            
            // Get available serial ports
            var portNames = SerialPort.GetPortNames();
            
            foreach (var portName in portNames)
            {
                try
                {
                    // Try to identify OpenBCI devices by attempting connection
                    var device = await TryIdentifyOpenBCIDevice(portName);
                    if (device != null)
                    {
                        devices.Add(device);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Failed to identify device on port {Port}: {Error}", portName, ex.Message);
                }
            }

            // Add simulated device for development
            if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
            {
                devices.Add(CreateSimulatedDevice());
            }

            _logger.LogInformation("Discovered {Count} EEG devices", devices.Count);
            return devices;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error discovering EEG devices");
            throw;
        }
    }

    private async Task<EegDevice?> TryIdentifyOpenBCIDevice(string portName)
    {
        SerialPort? serialPort = null;
        try
        {
            serialPort = new SerialPort(portName, 115200)
            {
                ReadTimeout = 1000,
                WriteTimeout = 1000
            };

            serialPort.Open();
            
            // Send soft reset command
            serialPort.Write("v");
            await Task.Delay(100);

            // Read response
            var response = serialPort.ReadExisting();
            
            if (response.Contains("OpenBCI"))
            {
                var deviceType = DetermineDeviceType(response);
                var serialNumber = ExtractSerialNumber(response);
                var firmwareVersion = ExtractFirmwareVersion(response);

                return new EegDevice
                {
                    Id = $"openbci_{portName.Replace("/", "_").Replace("\\", "_")}",
                    Name = $"OpenBCI {deviceType} ({portName})",
                    Type = GetDeviceTypeEnum(deviceType),
                    SerialNumber = serialNumber,
                    FirmwareVersion = firmwareVersion,
                    Status = DeviceStatus.Disconnected,
                    ConnectionInfo = new DeviceConnectionInfo
                    {
                        ConnectionType = "Serial",
                        Port = portName,
                        BaudRate = 115200
                    },
                    Capabilities = GetDeviceCapabilities(deviceType),
                    LastSeen = DateTime.UtcNow
                };
            }

            return null;
        }
        catch
        {
            return null;
        }
        finally
        {
            serialPort?.Close();
            serialPort?.Dispose();
        }
    }

    public async Task<DeviceConnectionResult> ConnectDeviceAsync(string deviceId, DeviceConnectionParams parameters)
    {
        try
        {
            if (_connectedDevices.ContainsKey(deviceId))
            {
                return new DeviceConnectionResult
                {
                    Success = false,
                    Message = "Device is already connected",
                    ErrorCode = "ALREADY_CONNECTED"
                };
            }

            // Handle simulated device
            if (deviceId.StartsWith("simulated_"))
            {
                return await ConnectSimulatedDevice(deviceId);
            }

            // Connect to real OpenBCI device
            var serialPort = new SerialPort(parameters.Port, parameters.BaudRate)
            {
                ReadTimeout = 5000,
                WriteTimeout = 5000,
                DataReceived += (sender, e) => OnDataReceived(deviceId, sender as SerialPort)
            };

            serialPort.Open();

            // Initialize OpenBCI
            var initSuccess = await InitializeOpenBCIDevice(serialPort);
            if (!initSuccess)
            {
                serialPort.Close();
                return new DeviceConnectionResult
                {
                    Success = false,
                    Message = "Failed to initialize OpenBCI device",
                    ErrorCode = "INIT_FAILED"
                };
            }

            // Create device object
            var device = new EegDevice
            {
                Id = deviceId,
                Status = DeviceStatus.Connected,
                ConnectedAt = DateTime.UtcNow,
                ConnectionInfo = new DeviceConnectionInfo
                {
                    ConnectionType = parameters.ConnectionType,
                    Port = parameters.Port,
                    BaudRate = parameters.BaudRate
                }
            };

            _connectedDevices[deviceId] = device;
            _serialPorts[deviceId] = serialPort;

            _logger.LogInformation("Connected to OpenBCI device {DeviceId} on port {Port}", deviceId, parameters.Port);

            return new DeviceConnectionResult
            {
                Success = true,
                Message = "Successfully connected to device",
                Device = device
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error connecting to device {DeviceId}", deviceId);
            return new DeviceConnectionResult
            {
                Success = false,
                Message = ex.Message,
                ErrorCode = "CONNECTION_ERROR"
            };
        }
    }

    public async Task<bool> DisconnectDeviceAsync(string deviceId)
    {
        try
        {
            // Stop any active streaming or recording
            await StopStreamingAsync(deviceId);
            var recordings = _recordingSessions.Values.Where(r => r.DeviceId == deviceId).ToList();
            foreach (var recording in recordings)
            {
                await StopRecordingAsync(recording.Id);
            }

            // Close serial port
            if (_serialPorts.TryRemove(deviceId, out var serialPort))
            {
                serialPort.Close();
                serialPort.Dispose();
            }

            // Remove device
            _connectedDevices.TryRemove(deviceId, out _);

            _logger.LogInformation("Disconnected device {DeviceId}", deviceId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error disconnecting device {DeviceId}", deviceId);
            return false;
        }
    }

    public async Task<List<EegDevice>> GetConnectedDevicesAsync(string userId)
    {
        return _connectedDevices.Values
            .Where(d => string.IsNullOrEmpty(d.ConnectedUserId) || d.ConnectedUserId == userId)
            .ToList();
    }

    #endregion

    #region Device Configuration

    public async Task<DeviceConfiguration> GetDeviceConfigurationAsync(string deviceId)
    {
        if (!_connectedDevices.ContainsKey(deviceId))
        {
            throw new InvalidOperationException("Device not connected");
        }

        // For OpenBCI, return default configuration
        // In a real implementation, this would query the device for current settings
        var device = _connectedDevices[deviceId];
        var channelCount = GetChannelCount(device.Type);

        return new DeviceConfiguration
        {
            DeviceId = deviceId,
            SampleRate = 250,
            Channels = Enumerable.Range(1, channelCount)
                .Select(i => new ChannelConfiguration
                {
                    ChannelNumber = i,
                    Enabled = true,
                    Name = $"Channel {i}",
                    Gain = "24x",
                    InputType = "Normal"
                }).ToList(),
            Filters = new FilterConfiguration
            {
                HighPassEnabled = true,
                HighPassCutoff = 1.0,
                LowPassEnabled = true,
                LowPassCutoff = 50.0,
                NotchEnabled = true,
                NotchFrequency = 60.0
            }
        };
    }

    public async Task<bool> UpdateDeviceConfigurationAsync(string deviceId, DeviceConfiguration configuration)
    {
        try
        {
            if (!_serialPorts.TryGetValue(deviceId, out var serialPort))
            {
                throw new InvalidOperationException("Device not connected");
            }

            // Apply configuration to OpenBCI device
            await ApplyOpenBCIConfiguration(serialPort, configuration);

            _logger.LogInformation("Updated configuration for device {DeviceId}", deviceId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating device configuration {DeviceId}", deviceId);
            return false;
        }
    }

    public async Task<List<DeviceCapabilities>> GetDeviceCapabilitiesAsync(string deviceType)
    {
        var capabilities = new List<DeviceCapabilities>();

        // OpenBCI Cyton capabilities
        capabilities.Add(new DeviceCapabilities
        {
            MaxChannels = 8,
            SupportedSampleRates = new List<int> { 125, 250, 500, 1000, 2000, 4000, 8000, 16000 },
            SupportedGains = new List<string> { "1x", "2x", "4x", "6x", "8x", "12x", "24x" },
            SupportsImpedanceTest = true,
            SupportsAccelerometer = true,
            SupportsAnalogInputs = true,
            SupportsDigitalInputs = true,
            SupportedFilters = new List<string> { "HighPass", "LowPass", "Notch" },
            BatteryVoltageMin = 3.4,
            BatteryVoltageMax = 4.2
        });

        return capabilities;
    }

    #endregion

    #region Data Streaming

    public async Task<bool> StartStreamingAsync(string deviceId, StreamingConfiguration config)
    {
        try
        {
            if (!_serialPorts.TryGetValue(deviceId, out var serialPort))
            {
                throw new InvalidOperationException("Device not connected");
            }

            if (_streamingSessions.ContainsKey(deviceId))
            {
                throw new InvalidOperationException("Device is already streaming");
            }

            // Create streaming session
            var session = new StreamingSession
            {
                DeviceId = deviceId,
                UserId = config.UserId,
                Configuration = config,
                StartedAt = DateTime.UtcNow,
                IsActive = true
            };

            _streamingSessions[deviceId] = session;

            // Start streaming on OpenBCI device
            serialPort.Write("b"); // Start streaming command

            // Update device status
            if (_connectedDevices.TryGetValue(deviceId, out var device))
            {
                device.Status = DeviceStatus.Streaming;
            }

            _logger.LogInformation("Started streaming for device {DeviceId}", deviceId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting streaming for device {DeviceId}", deviceId);
            return false;
        }
    }

    public async Task<bool> StopStreamingAsync(string deviceId)
    {
        try
        {
            if (_serialPorts.TryGetValue(deviceId, out var serialPort))
            {
                serialPort.Write("s"); // Stop streaming command
            }

            if (_streamingSessions.TryRemove(deviceId, out var session))
            {
                session.IsActive = false;
            }

            // Update device status
            if (_connectedDevices.TryGetValue(deviceId, out var device))
            {
                device.Status = DeviceStatus.Connected;
            }

            _logger.LogInformation("Stopped streaming for device {DeviceId}", deviceId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping streaming for device {DeviceId}", deviceId);
            return false;
        }
    }

    public async Task<StreamingStatus> GetStreamingStatusAsync(string deviceId)
    {
        if (_streamingSessions.TryGetValue(deviceId, out var session))
        {
            return new StreamingStatus
            {
                DeviceId = deviceId,
                IsStreaming = session.IsActive,
                StartedAt = session.StartedAt,
                SamplesReceived = session.SamplesReceived,
                BytesReceived = session.BytesReceived,
                SampleRate = session.SampleRate,
                DroppedSamples = session.DroppedSamples,
                BufferFillLevel = session.BufferFillLevel
            };
        }

        return new StreamingStatus { DeviceId = deviceId, IsStreaming = false };
    }

    #endregion

    #region Helper Methods

    private DeviceType GetDeviceTypeEnum(string deviceType)
    {
        return deviceType.ToLower() switch
        {
            "cyton" => DeviceType.OpenBCICyton,
            "daisy" => DeviceType.OpenBCIDaisy,
            "ganglion" => DeviceType.OpenBCIGanglion,
            _ => DeviceType.OpenBCICyton
        };
    }

    private int GetChannelCount(DeviceType deviceType)
    {
        return deviceType switch
        {
            DeviceType.OpenBCICyton => 8,
            DeviceType.OpenBCIDaisy => 16,
            DeviceType.OpenBCIGanglion => 4,
            _ => 8
        };
    }

    private string DetermineDeviceType(string response)
    {
        if (response.Contains("Cyton")) return "Cyton";
        if (response.Contains("Daisy")) return "Daisy";
        if (response.Contains("Ganglion")) return "Ganglion";
        return "Cyton"; // Default
    }

    private string ExtractSerialNumber(string response)
    {
        // Extract serial number from device response
        // This is a simplified implementation
        return Guid.NewGuid().ToString("N")[..8];
    }

    private string ExtractFirmwareVersion(string response)
    {
        // Extract firmware version from device response
        // This is a simplified implementation
        return "v3.1.2";
    }

    private DeviceCapabilities GetDeviceCapabilities(string deviceType)
    {
        return deviceType.ToLower() switch
        {
            "cyton" => new DeviceCapabilities
            {
                MaxChannels = 8,
                SupportedSampleRates = new List<int> { 125, 250, 500, 1000, 2000, 4000, 8000, 16000 },
                SupportedGains = new List<string> { "1x", "2x", "4x", "6x", "8x", "12x", "24x" },
                SupportsImpedanceTest = true,
                SupportsAccelerometer = true,
                SupportsAnalogInputs = true,
                SupportsDigitalInputs = true,
                BatteryVoltageMin = 3.4,
                BatteryVoltageMax = 4.2
            },
            _ => new DeviceCapabilities()
        };
    }

    private async Task<bool> InitializeOpenBCIDevice(SerialPort serialPort)
    {
        try
        {
            // Send reset command
            serialPort.Write("v");
            await Task.Delay(100);

            // Set to default settings
            serialPort.Write("d");
            await Task.Delay(100);

            return true;
        }
        catch
        {
            return false;
        }
    }

    private async Task ApplyOpenBCIConfiguration(SerialPort serialPort, DeviceConfiguration config)
    {
        // Apply sample rate
        var sampleRateCommand = config.SampleRate switch
        {
            16000 => "~0",
            8000 => "~1",
            4000 => "~2",
            2000 => "~3",
            1000 => "~4",
            500 => "~5",
            250 => "~6",
            _ => "~6" // Default to 250 Hz
        };
        serialPort.Write(sampleRateCommand);
        await Task.Delay(50);

        // Apply channel settings
        foreach (var channel in config.Channels)
        {
            if (channel.ChannelNumber >= 1 && channel.ChannelNumber <= 8)
            {
                var channelCommand = $"x{channel.ChannelNumber}0{(channel.Enabled ? "0" : "1")}0000X";
                serialPort.Write(channelCommand);
                await Task.Delay(50);
            }
        }
    }

    private EegDevice CreateSimulatedDevice()
    {
        return new EegDevice
        {
            Id = "simulated_cyton_001",
            Name = "Simulated OpenBCI Cyton",
            Type = DeviceType.SimulatedDevice,
            SerialNumber = "SIM001",
            FirmwareVersion = "v3.1.2-sim",
            Status = DeviceStatus.Disconnected,
            ConnectionInfo = new DeviceConnectionInfo
            {
                ConnectionType = "Simulated"
            },
            Capabilities = new DeviceCapabilities
            {
                MaxChannels = 8,
                SupportedSampleRates = new List<int> { 250, 500, 1000 },
                SupportedGains = new List<string> { "24x" },
                SupportsImpedanceTest = true,
                SupportsAccelerometer = true
            },
            LastSeen = DateTime.UtcNow
        };
    }

    private async Task<DeviceConnectionResult> ConnectSimulatedDevice(string deviceId)
    {
        var device = CreateSimulatedDevice();
        device.Id = deviceId;
        device.Status = DeviceStatus.Connected;
        device.ConnectedAt = DateTime.UtcNow;

        _connectedDevices[deviceId] = device;

        return new DeviceConnectionResult
        {
            Success = true,
            Message = "Connected to simulated device",
            Device = device
        };
    }

    private void OnDataReceived(string deviceId, SerialPort? serialPort)
    {
        if (serialPort == null || !_streamingSessions.TryGetValue(deviceId, out var session))
            return;

        try
        {
            var data = serialPort.ReadExisting();
            // Process incoming EEG data here
            // This would typically involve parsing the OpenBCI data format
            // and forwarding it to streaming targets
            
            session.SamplesReceived += data.Length; // Simplified
            session.BytesReceived += data.Length;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing data from device {DeviceId}", deviceId);
        }
    }

    // Placeholder implementations for interface completeness
    public Task<RecordingStatus> GetRecordingStatusAsync(string recordingId) => throw new NotImplementedException();
    public Task<string> StartRecordingAsync(string deviceId, RecordingConfiguration config) => throw new NotImplementedException();
    public Task<bool> StopRecordingAsync(string recordingId) => throw new NotImplementedException();
    public Task<DeviceHealth> GetDeviceHealthAsync(string deviceId) => throw new NotImplementedException();
    public Task<SignalQuality> GetSignalQualityAsync(string deviceId) => throw new NotImplementedException();
    public Task<List<DeviceEvent>> GetDeviceEventsAsync(string deviceId, DateTime? fromDate = null) => throw new NotImplementedException();
    public Task<CalibrationResult> CalibrateDeviceAsync(string deviceId, CalibrationType type) => throw new NotImplementedException();
    public Task<ImpedanceTestResult> RunImpedanceTestAsync(string deviceId) => throw new NotImplementedException();
    public Task<bool> SendTestSignalAsync(string deviceId, TestSignalType signalType) => throw new NotImplementedException();

    #endregion
}

// Helper classes for internal state management
internal class StreamingSession
{
    public string DeviceId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public StreamingConfiguration Configuration { get; set; } = new();
    public DateTime StartedAt { get; set; }
    public bool IsActive { get; set; }
    public long SamplesReceived { get; set; }
    public long BytesReceived { get; set; }
    public double SampleRate { get; set; } = 250;
    public int DroppedSamples { get; set; }
    public double BufferFillLevel { get; set; }
}

internal class RecordingSession
{
    public string Id { get; set; } = string.Empty;
    public string DeviceId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public RecordingConfiguration Configuration { get; set; } = new();
    public DateTime StartedAt { get; set; }
    public bool IsActive { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public long SamplesRecorded { get; set; }
    public long FileSize { get; set; }
}