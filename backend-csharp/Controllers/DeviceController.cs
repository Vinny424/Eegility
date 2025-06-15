using EegilityApi.Models;
using EegilityApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EegilityApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DeviceController : ControllerBase
{
    private readonly IDeviceService _deviceService;
    private readonly ILogger<DeviceController> _logger;

    public DeviceController(IDeviceService deviceService, ILogger<DeviceController> logger)
    {
        _deviceService = deviceService;
        _logger = logger;
    }

    /// <summary>
    /// Discover available EEG devices
    /// </summary>
    /// <returns>List of discovered devices</returns>
    [HttpGet("discover")]
    public async Task<ActionResult<List<EegDevice>>> DiscoverDevices()
    {
        try
        {
            var devices = await _deviceService.DiscoverDevicesAsync();
            return Ok(devices);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error discovering devices");
            return StatusCode(500, new { message = "Failed to discover devices" });
        }
    }

    /// <summary>
    /// Connect to an EEG device
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <param name="connectionParams">Connection parameters</param>
    /// <returns>Connection result</returns>
    [HttpPost("{deviceId}/connect")]
    public async Task<ActionResult<DeviceConnectionResult>> ConnectDevice(
        string deviceId, 
        [FromBody] DeviceConnectionParams connectionParams)
    {
        try
        {
            var result = await _deviceService.ConnectDeviceAsync(deviceId, connectionParams);
            
            if (result.Success)
            {
                return Ok(result);
            }
            else
            {
                return BadRequest(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error connecting to device {DeviceId}", deviceId);
            return StatusCode(500, new { message = "Failed to connect to device" });
        }
    }

    /// <summary>
    /// Disconnect from an EEG device
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <returns>Success status</returns>
    [HttpPost("{deviceId}/disconnect")]
    public async Task<IActionResult> DisconnectDevice(string deviceId)
    {
        try
        {
            var success = await _deviceService.DisconnectDeviceAsync(deviceId);
            
            if (success)
            {
                return Ok(new { message = "Device disconnected successfully" });
            }
            else
            {
                return BadRequest(new { message = "Failed to disconnect device" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error disconnecting device {DeviceId}", deviceId);
            return StatusCode(500, new { message = "Failed to disconnect device" });
        }
    }

    /// <summary>
    /// Get connected devices for current user
    /// </summary>
    /// <returns>List of connected devices</returns>
    [HttpGet("connected")]
    public async Task<ActionResult<List<EegDevice>>> GetConnectedDevices()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var devices = await _deviceService.GetConnectedDevicesAsync(userId);
            return Ok(devices);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting connected devices");
            return StatusCode(500, new { message = "Failed to get connected devices" });
        }
    }

    /// <summary>
    /// Get device configuration
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <returns>Device configuration</returns>
    [HttpGet("{deviceId}/configuration")]
    public async Task<ActionResult<DeviceConfiguration>> GetDeviceConfiguration(string deviceId)
    {
        try
        {
            var configuration = await _deviceService.GetDeviceConfigurationAsync(deviceId);
            return Ok(configuration);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting device configuration {DeviceId}", deviceId);
            return StatusCode(500, new { message = "Failed to get device configuration" });
        }
    }

    /// <summary>
    /// Update device configuration
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <param name="configuration">New configuration</param>
    /// <returns>Success status</returns>
    [HttpPut("{deviceId}/configuration")]
    public async Task<IActionResult> UpdateDeviceConfiguration(
        string deviceId, 
        [FromBody] DeviceConfiguration configuration)
    {
        try
        {
            var success = await _deviceService.UpdateDeviceConfigurationAsync(deviceId, configuration);
            
            if (success)
            {
                return Ok(new { message = "Configuration updated successfully" });
            }
            else
            {
                return BadRequest(new { message = "Failed to update configuration" });
            }
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating device configuration {DeviceId}", deviceId);
            return StatusCode(500, new { message = "Failed to update device configuration" });
        }
    }

    /// <summary>
    /// Get device capabilities by type
    /// </summary>
    /// <param name="deviceType">Device type</param>
    /// <returns>Device capabilities</returns>
    [HttpGet("capabilities/{deviceType}")]
    public async Task<ActionResult<List<DeviceCapabilities>>> GetDeviceCapabilities(string deviceType)
    {
        try
        {
            var capabilities = await _deviceService.GetDeviceCapabilitiesAsync(deviceType);
            return Ok(capabilities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting device capabilities for type {DeviceType}", deviceType);
            return StatusCode(500, new { message = "Failed to get device capabilities" });
        }
    }

    /// <summary>
    /// Start streaming from device
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <param name="config">Streaming configuration</param>
    /// <returns>Success status</returns>
    [HttpPost("{deviceId}/streaming/start")]
    public async Task<IActionResult> StartStreaming(
        string deviceId, 
        [FromBody] StreamingConfiguration config)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            config.UserId = userId;
            var success = await _deviceService.StartStreamingAsync(deviceId, config);
            
            if (success)
            {
                return Ok(new { message = "Streaming started successfully" });
            }
            else
            {
                return BadRequest(new { message = "Failed to start streaming" });
            }
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting streaming for device {DeviceId}", deviceId);
            return StatusCode(500, new { message = "Failed to start streaming" });
        }
    }

    /// <summary>
    /// Stop streaming from device
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <returns>Success status</returns>
    [HttpPost("{deviceId}/streaming/stop")]
    public async Task<IActionResult> StopStreaming(string deviceId)
    {
        try
        {
            var success = await _deviceService.StopStreamingAsync(deviceId);
            
            if (success)
            {
                return Ok(new { message = "Streaming stopped successfully" });
            }
            else
            {
                return BadRequest(new { message = "Failed to stop streaming" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping streaming for device {DeviceId}", deviceId);
            return StatusCode(500, new { message = "Failed to stop streaming" });
        }
    }

    /// <summary>
    /// Get streaming status
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <returns>Streaming status</returns>
    [HttpGet("{deviceId}/streaming/status")]
    public async Task<ActionResult<StreamingStatus>> GetStreamingStatus(string deviceId)
    {
        try
        {
            var status = await _deviceService.GetStreamingStatusAsync(deviceId);
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting streaming status for device {DeviceId}", deviceId);
            return StatusCode(500, new { message = "Failed to get streaming status" });
        }
    }

    /// <summary>
    /// Start recording from device
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <param name="config">Recording configuration</param>
    /// <returns>Recording ID</returns>
    [HttpPost("{deviceId}/recording/start")]
    public async Task<ActionResult<string>> StartRecording(
        string deviceId, 
        [FromBody] RecordingConfiguration config)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            config.UserId = userId;
            var recordingId = await _deviceService.StartRecordingAsync(deviceId, config);
            
            return Ok(new { recordingId, message = "Recording started successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting recording for device {DeviceId}", deviceId);
            return StatusCode(500, new { message = "Failed to start recording" });
        }
    }

    /// <summary>
    /// Stop recording
    /// </summary>
    /// <param name="recordingId">Recording ID</param>
    /// <returns>Success status</returns>
    [HttpPost("recording/{recordingId}/stop")]
    public async Task<IActionResult> StopRecording(string recordingId)
    {
        try
        {
            var success = await _deviceService.StopRecordingAsync(recordingId);
            
            if (success)
            {
                return Ok(new { message = "Recording stopped successfully" });
            }
            else
            {
                return BadRequest(new { message = "Failed to stop recording" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping recording {RecordingId}", recordingId);
            return StatusCode(500, new { message = "Failed to stop recording" });
        }
    }

    /// <summary>
    /// Get recording status
    /// </summary>
    /// <param name="recordingId">Recording ID</param>
    /// <returns>Recording status</returns>
    [HttpGet("recording/{recordingId}/status")]
    public async Task<ActionResult<RecordingStatus>> GetRecordingStatus(string recordingId)
    {
        try
        {
            var status = await _deviceService.GetRecordingStatusAsync(recordingId);
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recording status for {RecordingId}", recordingId);
            return StatusCode(500, new { message = "Failed to get recording status" });
        }
    }

    /// <summary>
    /// Get device health
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <returns>Device health information</returns>
    [HttpGet("{deviceId}/health")]
    public async Task<ActionResult<DeviceHealth>> GetDeviceHealth(string deviceId)
    {
        try
        {
            var health = await _deviceService.GetDeviceHealthAsync(deviceId);
            return Ok(health);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting device health for {DeviceId}", deviceId);
            return StatusCode(500, new { message = "Failed to get device health" });
        }
    }

    /// <summary>
    /// Get signal quality
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <returns>Signal quality information</returns>
    [HttpGet("{deviceId}/signal-quality")]
    public async Task<ActionResult<SignalQuality>> GetSignalQuality(string deviceId)
    {
        try
        {
            var quality = await _deviceService.GetSignalQualityAsync(deviceId);
            return Ok(quality);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting signal quality for {DeviceId}", deviceId);
            return StatusCode(500, new { message = "Failed to get signal quality" });
        }
    }

    /// <summary>
    /// Run impedance test
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <returns>Impedance test results</returns>
    [HttpPost("{deviceId}/impedance-test")]
    public async Task<ActionResult<ImpedanceTestResult>> RunImpedanceTest(string deviceId)
    {
        try
        {
            var result = await _deviceService.RunImpedanceTestAsync(deviceId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running impedance test for device {DeviceId}", deviceId);
            return StatusCode(500, new { message = "Failed to run impedance test" });
        }
    }

    /// <summary>
    /// Calibrate device
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <param name="type">Calibration type</param>
    /// <returns>Calibration results</returns>
    [HttpPost("{deviceId}/calibrate")]
    public async Task<ActionResult<CalibrationResult>> CalibrateDevice(
        string deviceId, 
        [FromBody] CalibrationType type)
    {
        try
        {
            var result = await _deviceService.CalibrateDeviceAsync(deviceId, type);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calibrating device {DeviceId}", deviceId);
            return StatusCode(500, new { message = "Failed to calibrate device" });
        }
    }

    /// <summary>
    /// Send test signal
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <param name="signalType">Test signal type</param>
    /// <returns>Success status</returns>
    [HttpPost("{deviceId}/test-signal")]
    public async Task<IActionResult> SendTestSignal(
        string deviceId, 
        [FromBody] TestSignalType signalType)
    {
        try
        {
            var success = await _deviceService.SendTestSignalAsync(deviceId, signalType);
            
            if (success)
            {
                return Ok(new { message = "Test signal sent successfully" });
            }
            else
            {
                return BadRequest(new { message = "Failed to send test signal" });
            }
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending test signal for device {DeviceId}", deviceId);
            return StatusCode(500, new { message = "Failed to send test signal" });
        }
    }

    /// <summary>
    /// Get device events
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <param name="fromDate">Filter events from this date</param>
    /// <returns>List of device events</returns>
    [HttpGet("{deviceId}/events")]
    public async Task<ActionResult<List<DeviceEvent>>> GetDeviceEvents(
        string deviceId, 
        [FromQuery] DateTime? fromDate = null)
    {
        try
        {
            var events = await _deviceService.GetDeviceEventsAsync(deviceId, fromDate);
            return Ok(events);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting device events for {DeviceId}", deviceId);
            return StatusCode(500, new { message = "Failed to get device events" });
        }
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}