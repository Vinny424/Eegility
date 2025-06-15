// API Response Types
export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
  success: boolean
}

// User Types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  institution: string
  department: string
  phone: string
  createdAt: string
  lastLoginAt?: string
  isActive: boolean
  organization?: string
  title?: string
  avatar?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  institution?: string
  department?: string
  phone?: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  expiresAt: string
  user: User
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

// EEG Data Types
export interface EegData {
  id: string
  filename: string
  originalFilename: string
  format: EegFormat
  size: number
  uploadDate: string
  metadata: EegMetadata
  bidsCompliant: boolean
  tags: string[]
  notes: string
  adhdAnalysis?: AdhdAnalysis
  dataUrl?: string
}

export enum EegFormat {
  Edf = 'Edf',
  Bdf = 'Bdf',
  Vhdr = 'Vhdr',
  Set = 'Set',
  Fif = 'Fif',
  Cnt = 'Cnt',
  Npy = 'Npy'
}

export interface EegMetadata {
  subject: SubjectMetadata
  session: string
  task: string
  acquisition: string
  channels: number
  sampleRate: number
  duration: number
  customFields: Record<string, any>
}

export interface SubjectMetadata {
  id: string
  age?: number
  gender: string
  group: string
  handedness: string
  medications: string[]
  diagnosis: string
}

export interface EegUploadRequest {
  file: File
  notes?: string
  tags?: string[]
  subjectId: string
  subjectAge?: number
  subjectGender?: string
  subjectGroup?: string
  session?: string
  task?: string
  acquisition?: string
}

// ADHD Analysis Types
export interface AdhdAnalysis {
  requested: boolean
  performed: boolean
  inProgress: boolean
  result: string
  confidence: number
  performedAt?: string
  error?: string
  details?: AdhdAnalysisDetails
}

export interface AdhdAnalysisDetails {
  probabilities: Record<string, number>
  featuresUsed: string[]
  keyFeatures: KeyFeatures
  modelVersion: string
}

export interface KeyFeatures {
  thetaBetaRatio?: number
  frontalTheta?: number
  centralBeta?: number
  alphaActivity?: number
  additionalFeatures: Record<string, number>
}

export interface AdhdAnalysisRequest {
  eegDataId: string
}

// BIDS Types
export interface BidsMetadata {
  subject: string
  session: string
  task: string
  acquisition: string
  run: string
  recording: string
  participants: Record<string, any>
  taskMetadata: Record<string, any>
}

// UI State Types
export interface LoadingState {
  isLoading: boolean
  error?: string
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface SearchParams {
  searchTerm?: string
  tags?: string[]
  format?: EegFormat
}

// Theme Types
export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  success: string
  warning: string
  error: string
}

// Navigation Types
export interface NavigationItem {
  label: string
  path: string
  icon: string
  requiresAuth?: boolean
  adminOnly?: boolean
}

// Form Types
export interface FormErrors {
  [key: string]: string | undefined
}

// File Upload Types
export interface FileUploadProgress {
  progress: number
  status: 'idle' | 'uploading' | 'success' | 'error'
  error?: string
}

// Device Integration Types
export interface DeviceConfig {
  type: 'hospital' | 'openbci-mk3' | 'openbci-mk4'
  name: string
  settings: Record<string, any>
  isConnected: boolean
}

export interface StreamingData {
  timestamp: number
  channels: number[]
  sampleRate: number
}

// Analytics Types
export interface AnalyticsData {
  totalUploads: number
  totalUsers: number
  adhdAnalysisCount: number
  storageUsed: number
  recentActivity: ActivityLog[]
}

export interface ActivityLog {
  id: string
  userId: string
  action: string
  timestamp: string
  details: Record<string, any>
}