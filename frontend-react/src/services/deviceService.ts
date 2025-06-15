import api, { handleApiResponse, handleApiError } from './api'

// Device Types
export interface EegDevice {
  id: string
  name: string
  type: DeviceType
  serialNumber: string
  firmwareVersion: string
  hardwareVersion: string
  status: DeviceStatus
  lastSeen?: string
  connectionInfo?: DeviceConnectionInfo
  capabilities?: DeviceCapabilities
  connectedUserId: string
  connectedAt?: string
}

export enum DeviceType {
  OpenBCICyton = 'OpenBCICyton',
  OpenBCIDaisy = 'OpenBCIDaisy',
  OpenBCIGanglion = 'OpenBCIGanglion',
  HospitalSystem = 'HospitalSystem',
  SimulatedDevice = 'SimulatedDevice'
}

export enum DeviceStatus {
  Disconnected = 'Disconnected',
  Connecting = 'Connecting',
  Connected = 'Connected',
  Streaming = 'Streaming',
  Recording = 'Recording',
  Error = 'Error',
  Calibrating = 'Calibrating'
}

export interface DeviceConnectionInfo {
  connectionType: string
  port: string
  baudRate: number
  macAddress: string
  ipAddress: string
  signalStrength: number
}

export interface DeviceCapabilities {
  maxChannels: number
  supportedSampleRates: number[]
  supportedGains: string[]
  supportsImpedanceTest: boolean
  supportsAccelerometer: boolean
  supportsAnalogInputs: boolean
  supportsDigitalInputs: boolean
  supportedFilters: string[]
  batteryVoltageMin: number
  batteryVoltageMax: number
}

export interface DeviceConnectionParams {
  connectionType: string
  port: string
  baudRate: number
  additionalParams: Record<string, any>
}

export interface DeviceConnectionResult {
  success: boolean
  message: string
  device?: EegDevice
  errorCode?: string
}

export interface DeviceConfiguration {
  deviceId: string
  sampleRate: number
  channels: ChannelConfiguration[]
  filters: FilterConfiguration
  accelerometerEnabled: boolean
  customSettings: Record<string, any>
}

export interface ChannelConfiguration {
  channelNumber: number
  enabled: boolean
  name: string
  gain: string
  inputType: string
  biasEnabled: boolean
  srpEnabled: boolean
}

export interface FilterConfiguration {
  highPassEnabled: boolean
  highPassCutoff: number
  lowPassEnabled: boolean
  lowPassCutoff: number
  notchEnabled: boolean
  notchFrequency: number
}

export interface StreamingConfiguration {
  userId: string
  saveToFile: boolean
  fileName?: string
  streamingTargets: string[]
  bufferSize: number
  enableCompression: boolean
  metadata: Record<string, any>
}

export interface StreamingStatus {
  deviceId: string
  isStreaming: boolean
  startedAt?: string
  samplesReceived: number
  bytesReceived: number
  sampleRate: number
  droppedSamples: number
  bufferFillLevel: number
  activeTargets: string[]
}

export interface RecordingConfiguration {
  userId: string
  fileName: string
  format: string
  maxDuration?: number
  maxFileSize?: number
  autoSplit: boolean
  subjectMetadata: Record<string, any>
  sessionMetadata: Record<string, any>
}

export interface RecordingStatus {
  recordingId: string
  deviceId: string
  isRecording: boolean
  startedAt?: string
  duration: number
  samplesRecorded: number
  fileSize: number
  filePath: string
  progress: number
}

export interface DeviceHealth {
  deviceId: string
  timestamp: string
  batteryVoltage?: number
  batteryPercentage?: number
  temperature?: number
  isCharging: boolean
  channelHealth: ChannelHealth[]
  warnings: string[]
  errors: string[]
}

export interface ChannelHealth {
  channelNumber: number
  impedanceValue?: number
  impedanceLevel: ImpedanceLevel
  isConnected: boolean
  signalStrength?: number
  noiseLevel?: number
}

export enum ImpedanceLevel {
  Good = 'Good',
  Fair = 'Fair',
  Poor = 'Poor',
  Bad = 'Bad',
  NotTested = 'NotTested'
}

export interface SignalQuality {
  deviceId: string
  timestamp: string
  overallQuality: number
  channelQualities: ChannelQuality[]
  signalToNoiseRatio: number
  artifactLevel: number
  qualityIssues: string[]
}

export interface ChannelQuality {
  channelNumber: number
  quality: number
  signalAmplitude: number
  noiseLevel: number
  hasArtifacts: boolean
  issues: string[]
}

export interface ImpedanceTestResult {
  deviceId: string
  completedAt: string
  success: boolean
  channelResults: ChannelImpedance[]
  message: string
}

export interface ChannelImpedance {
  channelNumber: number
  impedanceValue: number
  level: ImpedanceLevel
  isAcceptable: boolean
}

export enum CalibrationType {
  OffsetCalibration = 'OffsetCalibration',
  GainCalibration = 'GainCalibration',
  ImpedanceCalibration = 'ImpedanceCalibration',
  FullCalibration = 'FullCalibration'
}

export interface CalibrationResult {
  deviceId: string
  type: CalibrationType
  success: boolean
  completedAt: string
  channelResults: ChannelCalibration[]
  message: string
}

export interface ChannelCalibration {
  channelNumber: number
  success: boolean
  offsetValue: number
  gainValue: number
  message: string
}

export enum TestSignalType {
  SquareWave = 'SquareWave',
  SineWave = 'SineWave',
  DC = 'DC',
  Ground = 'Ground'
}

export interface DeviceEvent {
  id: string
  deviceId: string
  timestamp: string
  type: DeviceEventType
  message: string
  data: Record<string, any>
  severity: EventSeverity
}

export enum DeviceEventType {
  Connected = 'Connected',
  Disconnected = 'Disconnected',
  StreamingStarted = 'StreamingStarted',
  StreamingStopped = 'StreamingStopped',
  RecordingStarted = 'RecordingStarted',
  RecordingStopped = 'RecordingStopped',
  ConfigurationChanged = 'ConfigurationChanged',
  ErrorOccurred = 'ErrorOccurred',
  BatteryLow = 'BatteryLow',
  SignalQualityChanged = 'SignalQualityChanged',
  CalibrationCompleted = 'CalibrationCompleted',
  ImpedanceTestCompleted = 'ImpedanceTestCompleted'
}

export enum EventSeverity {
  Info = 'Info',
  Warning = 'Warning',
  Error = 'Error',
  Critical = 'Critical'
}

export const deviceService = {
  // Device Discovery and Connection
  discoverDevices: async (): Promise<EegDevice[]> => {
    try {
      const response = await api.get<EegDevice[]>('/device/discover')
      return handleApiResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  },

  connectDevice: async (deviceId: string, params: DeviceConnectionParams): Promise<DeviceConnectionResult> => {
    try {
      const response = await api.post<DeviceConnectionResult>(`/device/${deviceId}/connect`, params)
      return handleApiResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  },

  disconnectDevice: async (deviceId: string): Promise<void> => {
    try {
      await api.post(`/device/${deviceId}/disconnect`)
    } catch (error) {
      return handleApiError(error)
    }
  },

  getConnectedDevices: async (): Promise<EegDevice[]> => {
    try {
      const response = await api.get<EegDevice[]>('/device/connected')
      return handleApiResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  },

  // Device Configuration
  getDeviceConfiguration: async (deviceId: string): Promise<DeviceConfiguration> => {
    try {
      const response = await api.get<DeviceConfiguration>(`/device/${deviceId}/configuration`)
      return handleApiResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  },

  updateDeviceConfiguration: async (deviceId: string, config: DeviceConfiguration): Promise<void> => {
    try {
      await api.put(`/device/${deviceId}/configuration`, config)
    } catch (error) {
      return handleApiError(error)
    }
  },

  getDeviceCapabilities: async (deviceType: string): Promise<DeviceCapabilities[]> => {
    try {
      const response = await api.get<DeviceCapabilities[]>(`/device/capabilities/${deviceType}`)
      return handleApiResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  },

  // Streaming
  startStreaming: async (deviceId: string, config: StreamingConfiguration): Promise<void> => {
    try {
      await api.post(`/device/${deviceId}/streaming/start`, config)
    } catch (error) {
      return handleApiError(error)
    }
  },

  stopStreaming: async (deviceId: string): Promise<void> => {
    try {
      await api.post(`/device/${deviceId}/streaming/stop`)
    } catch (error) {
      return handleApiError(error)
    }
  },

  getStreamingStatus: async (deviceId: string): Promise<StreamingStatus> => {
    try {
      const response = await api.get<StreamingStatus>(`/device/${deviceId}/streaming/status`)
      return handleApiResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  },

  // Recording
  startRecording: async (deviceId: string, config: RecordingConfiguration): Promise<string> => {
    try {
      const response = await api.post<{ recordingId: string }>(`/device/${deviceId}/recording/start`, config)
      return handleApiResponse(response).recordingId
    } catch (error) {
      return handleApiError(error)
    }
  },

  stopRecording: async (recordingId: string): Promise<void> => {
    try {
      await api.post(`/device/recording/${recordingId}/stop`)
    } catch (error) {
      return handleApiError(error)
    }
  },

  getRecordingStatus: async (recordingId: string): Promise<RecordingStatus> => {
    try {
      const response = await api.get<RecordingStatus>(`/device/recording/${recordingId}/status`)
      return handleApiResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  },

  // Health and Quality
  getDeviceHealth: async (deviceId: string): Promise<DeviceHealth> => {
    try {
      const response = await api.get<DeviceHealth>(`/device/${deviceId}/health`)
      return handleApiResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  },

  getSignalQuality: async (deviceId: string): Promise<SignalQuality> => {
    try {
      const response = await api.get<SignalQuality>(`/device/${deviceId}/signal-quality`)
      return handleApiResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  },

  // Testing and Calibration
  runImpedanceTest: async (deviceId: string): Promise<ImpedanceTestResult> => {
    try {
      const response = await api.post<ImpedanceTestResult>(`/device/${deviceId}/impedance-test`)
      return handleApiResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  },

  calibrateDevice: async (deviceId: string, type: CalibrationType): Promise<CalibrationResult> => {
    try {
      const response = await api.post<CalibrationResult>(`/device/${deviceId}/calibrate`, type)
      return handleApiResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  },

  sendTestSignal: async (deviceId: string, signalType: TestSignalType): Promise<void> => {
    try {
      await api.post(`/device/${deviceId}/test-signal`, signalType)
    } catch (error) {
      return handleApiError(error)
    }
  },

  // Events
  getDeviceEvents: async (deviceId: string, fromDate?: Date): Promise<DeviceEvent[]> => {
    try {
      const params = fromDate ? { fromDate: fromDate.toISOString() } : {}
      const response = await api.get<DeviceEvent[]>(`/device/${deviceId}/events`, { params })
      return handleApiResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  },

  // Utility functions
  getDeviceStatusColor: (status: DeviceStatus): string => {
    switch (status) {
      case DeviceStatus.Connected:
        return 'green'
      case DeviceStatus.Streaming:
        return 'blue'
      case DeviceStatus.Recording:
        return 'purple'
      case DeviceStatus.Connecting:
      case DeviceStatus.Calibrating:
        return 'orange'
      case DeviceStatus.Error:
        return 'red'
      case DeviceStatus.Disconnected:
      default:
        return 'gray'
    }
  },

  getImpedanceLevelColor: (level: ImpedanceLevel): string => {
    switch (level) {
      case ImpedanceLevel.Good:
        return 'green'
      case ImpedanceLevel.Fair:
        return 'yellow'
      case ImpedanceLevel.Poor:
        return 'orange'
      case ImpedanceLevel.Bad:
        return 'red'
      case ImpedanceLevel.NotTested:
      default:
        return 'gray'
    }
  },

  formatDeviceType: (type: DeviceType): string => {
    switch (type) {
      case DeviceType.OpenBCICyton:
        return 'OpenBCI Cyton (8ch)'
      case DeviceType.OpenBCIDaisy:
        return 'OpenBCI Cyton+Daisy (16ch)'
      case DeviceType.OpenBCIGanglion:
        return 'OpenBCI Ganglion (4ch)'
      case DeviceType.HospitalSystem:
        return 'Hospital EEG System'
      case DeviceType.SimulatedDevice:
        return 'Simulated Device'
      default:
        return 'Unknown Device'
    }
  },

  getChannelCount: (type: DeviceType): number => {
    switch (type) {
      case DeviceType.OpenBCICyton:
        return 8
      case DeviceType.OpenBCIDaisy:
        return 16
      case DeviceType.OpenBCIGanglion:
        return 4
      case DeviceType.HospitalSystem:
        return 32 // Default for hospital systems
      case DeviceType.SimulatedDevice:
        return 8
      default:
        return 8
    }
  }
}