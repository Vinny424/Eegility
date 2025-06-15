import api, { handleApiResponse, handleApiError, createFileUploadApi } from './api'
import type { 
  EegData, 
  EegUploadRequest, 
  AdhdAnalysis, 
  AdhdAnalysisRequest,
  SearchParams,
  PaginationParams,
  EegFormat
} from '@/types'

export const eegDataService = {
  // Upload EEG data file
  uploadEegData: async (
    uploadData: EegUploadRequest,
    onProgress?: (progress: number) => void
  ): Promise<EegData> => {
    try {
      const uploadApi = createFileUploadApi()
      const formData = new FormData()
      
      formData.append('file', uploadData.file)
      formData.append('subjectId', uploadData.subjectId)
      
      if (uploadData.notes) formData.append('notes', uploadData.notes)
      if (uploadData.subjectAge) formData.append('subjectAge', uploadData.subjectAge.toString())
      if (uploadData.subjectGender) formData.append('subjectGender', uploadData.subjectGender)
      if (uploadData.subjectGroup) formData.append('subjectGroup', uploadData.subjectGroup)
      if (uploadData.session) formData.append('session', uploadData.session)
      if (uploadData.task) formData.append('task', uploadData.task)
      if (uploadData.acquisition) formData.append('acquisition', uploadData.acquisition)
      
      if (uploadData.tags) {
        uploadData.tags.forEach((tag) => formData.append('tags', tag))
      }

      const response = await uploadApi.post<EegData>('/eegdata/upload', formData, {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        },
      })
      
      return handleApiResponse(response)
    } catch (error) {
      handleApiError(error)
    }
  },

  // Get user's EEG data with pagination
  getUserEegData: async (params: PaginationParams): Promise<EegData[]> => {
    try {
      const response = await api.get<EegData[]>('/eegdata', {
        params: {
          page: params.page,
          pageSize: params.pageSize,
        },
      })
      return handleApiResponse(response)
    } catch (error) {
      handleApiError(error)
    }
  },

  // Get specific EEG data by ID
  getEegDataById: async (id: string): Promise<EegData> => {
    try {
      const response = await api.get<EegData>(`/eegdata/${id}`)
      return handleApiResponse(response)
    } catch (error) {
      handleApiError(error)
    }
  },

  // Update EEG data metadata
  updateEegData: async (id: string, updateData: Partial<EegData>): Promise<EegData> => {
    try {
      const response = await api.put<EegData>(`/eegdata/${id}`, updateData)
      return handleApiResponse(response)
    } catch (error) {
      handleApiError(error)
    }
  },

  // Delete EEG data
  deleteEegData: async (id: string): Promise<void> => {
    try {
      await api.delete(`/eegdata/${id}`)
    } catch (error) {
      handleApiError(error)
    }
  },

  // Download EEG data file
  downloadEegData: async (id: string, filename: string): Promise<Blob> => {
    try {
      const response = await api.get(`/eegdata/${id}/download`, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      handleApiError(error)
    }
  },

  // Request ADHD analysis
  requestAdhdAnalysis: async (request: AdhdAnalysisRequest): Promise<void> => {
    try {
      await api.post('/eegdata/analysis/request', request)
    } catch (error) {
      handleApiError(error)
    }
  },

  // Get ADHD analysis results
  getAdhdAnalysis: async (eegDataId: string): Promise<AdhdAnalysis> => {
    try {
      const response = await api.get<AdhdAnalysis>(`/eegdata/${eegDataId}/analysis`)
      return handleApiResponse(response)
    } catch (error) {
      handleApiError(error)
    }
  },

  // Search EEG data
  searchEegData: async (searchParams: SearchParams): Promise<EegData[]> => {
    try {
      const params: any = {}
      
      if (searchParams.searchTerm) params.searchTerm = searchParams.searchTerm
      if (searchParams.format) params.format = searchParams.format
      if (searchParams.tags && searchParams.tags.length > 0) {
        params.tags = searchParams.tags
      }

      const response = await api.get<EegData[]>('/eegdata/search', { params })
      return handleApiResponse(response)
    } catch (error) {
      handleApiError(error)
    }
  },

  // Validate BIDS compliance
  validateBidsCompliance: async (eegDataId: string): Promise<{ bidsCompliant: boolean }> => {
    try {
      const response = await api.get<{ bidsCompliant: boolean }>(`/eegdata/${eegDataId}/bids/validate`)
      return handleApiResponse(response)
    } catch (error) {
      handleApiError(error)
    }
  },

  // Get supported EEG formats
  getSupportedFormats: (): { value: EegFormat; label: string; extensions: string[] }[] => {
    return [
      { value: EegFormat.Edf, label: 'European Data Format', extensions: ['.edf'] },
      { value: EegFormat.Bdf, label: 'BioSemi Data Format', extensions: ['.bdf'] },
      { value: EegFormat.Vhdr, label: 'BrainVision Format', extensions: ['.vhdr'] },
      { value: EegFormat.Set, label: 'EEGLAB Format', extensions: ['.set'] },
      { value: EegFormat.Fif, label: 'FIFF Format', extensions: ['.fif'] },
      { value: EegFormat.Cnt, label: 'Neuroscan Format', extensions: ['.cnt'] },
      { value: EegFormat.Npy, label: 'NumPy Array', extensions: ['.npy'] },
    ]
  },

  // Helper function to download file
  downloadFile: (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },
}