import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEegDataStore } from '@/store/eegDataStore'
import { eegDataService } from '@/services/eegDataService'
import type { 
  EegData, 
  EegUploadRequest, 
  AdhdAnalysisRequest,
  SearchParams,
  PaginationParams
} from '@/types'

export const useEegData = () => {
  const queryClient = useQueryClient()
  const {
    eegDataList,
    selectedEegData,
    searchParams,
    loadingState,
    pagination,
    uploadProgress,
    setEegDataList,
    addEegData,
    updateEegData,
    removeEegData,
    setSelectedEegData,
    setSearchParams,
    setLoadingState,
    setPagination,
    setUploadProgress,
    clearUploadProgress,
  } = useEegDataStore()

  // Get user's EEG data
  const eegDataQuery = useQuery({
    queryKey: ['eegData', 'list', pagination.currentPage, pagination.pageSize],
    queryFn: () => eegDataService.getUserEegData({
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Get specific EEG data
  const getEegDataQuery = (id: string) => useQuery({
    queryKey: ['eegData', 'detail', id],
    queryFn: () => eegDataService.getEegDataById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Search EEG data
  const searchQuery = useQuery({
    queryKey: ['eegData', 'search', searchParams],
    queryFn: () => eegDataService.searchEegData(searchParams),
    enabled: Object.keys(searchParams).length > 0,
    staleTime: 30 * 1000, // 30 seconds
  })

  // Upload EEG data mutation
  const uploadMutation = useMutation({
    mutationFn: ({ data, fileId }: { data: EegUploadRequest; fileId: string }) => 
      eegDataService.uploadEegData(data, (progress) => {
        setUploadProgress(fileId, progress)
      }),
    onSuccess: (data, { fileId }) => {
      addEegData(data)
      clearUploadProgress(fileId)
      queryClient.invalidateQueries({ queryKey: ['eegData', 'list'] })
    },
    onError: (error, { fileId }) => {
      clearUploadProgress(fileId)
      setLoadingState({ error: error.message })
    },
  })

  // Update EEG data mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EegData> }) =>
      eegDataService.updateEegData(id, data),
    onSuccess: (data) => {
      updateEegData(data.id, data)
      queryClient.setQueryData(['eegData', 'detail', data.id], data)
      queryClient.invalidateQueries({ queryKey: ['eegData', 'list'] })
    },
  })

  // Delete EEG data mutation
  const deleteMutation = useMutation({
    mutationFn: eegDataService.deleteEegData,
    onSuccess: (_, id) => {
      removeEegData(id)
      queryClient.removeQueries({ queryKey: ['eegData', 'detail', id] })
      queryClient.invalidateQueries({ queryKey: ['eegData', 'list'] })
    },
  })

  // Download EEG data mutation
  const downloadMutation = useMutation({
    mutationFn: ({ id, filename }: { id: string; filename: string }) =>
      eegDataService.downloadEegData(id, filename),
    onSuccess: (blob, { filename }) => {
      eegDataService.downloadFile(blob, filename)
    },
  })

  // Request ADHD analysis mutation
  const adhdAnalysisMutation = useMutation({
    mutationFn: eegDataService.requestAdhdAnalysis,
    onSuccess: (_, { eegDataId }) => {
      // Update the EEG data to show analysis is requested
      updateEegData(eegDataId, {
        adhdAnalysis: {
          requested: true,
          performed: false,
          inProgress: true,
          result: '',
          confidence: 0,
        }
      })
      queryClient.invalidateQueries({ queryKey: ['eegData', 'detail', eegDataId] })
    },
  })

  // Get ADHD analysis query
  const getAdhdAnalysisQuery = (eegDataId: string) => useQuery({
    queryKey: ['eegData', 'analysis', eegDataId],
    queryFn: () => eegDataService.getAdhdAnalysis(eegDataId),
    enabled: !!eegDataId,
    refetchInterval: (data) => {
      // Poll every 5 seconds if analysis is in progress
      return data?.inProgress ? 5000 : false
    },
  })

  // Validate BIDS compliance query
  const bidsValidationQuery = (eegDataId: string) => useQuery({
    queryKey: ['eegData', 'bids', eegDataId],
    queryFn: () => eegDataService.validateBidsCompliance(eegDataId),
    enabled: !!eegDataId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Helper functions
  const uploadEegData = (data: EegUploadRequest) => {
    const fileId = `${Date.now()}-${Math.random()}`
    return uploadMutation.mutateAsync({ data, fileId })
  }

  const updateEegDataItem = (id: string, data: Partial<EegData>) => {
    return updateMutation.mutateAsync({ id, data })
  }

  const deleteEegDataItem = (id: string) => {
    return deleteMutation.mutateAsync(id)
  }

  const downloadEegDataFile = (id: string, filename: string) => {
    return downloadMutation.mutateAsync({ id, filename })
  }

  const requestAdhdAnalysis = (eegDataId: string) => {
    return adhdAnalysisMutation.mutateAsync({ eegDataId })
  }

  const updateSearchParams = (params: Partial<SearchParams>) => {
    setSearchParams(params)
  }

  const updatePagination = (params: Partial<typeof pagination>) => {
    setPagination(params)
  }

  const selectEegData = (data: EegData | null) => {
    setSelectedEegData(data)
  }

  const getSupportedFormats = () => {
    return eegDataService.getSupportedFormats()
  }

  return {
    // State
    eegDataList: eegDataQuery.data || eegDataList,
    selectedEegData,
    searchResults: searchQuery.data,
    searchParams,
    pagination,
    uploadProgress,
    loadingState,

    // Query states
    isLoading: eegDataQuery.isLoading,
    isSearching: searchQuery.isLoading,
    error: eegDataQuery.error?.message || loadingState.error,
    searchError: searchQuery.error?.message,

    // Mutation states
    isUploading: uploadMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDownloading: downloadMutation.isPending,
    isRequestingAnalysis: adhdAnalysisMutation.isPending,

    // Actions
    uploadEegData,
    updateEegDataItem,
    deleteEegDataItem,
    downloadEegDataFile,
    requestAdhdAnalysis,
    updateSearchParams,
    updatePagination,
    selectEegData,
    getSupportedFormats,

    // Query functions for specific data
    getEegDataQuery,
    getAdhdAnalysisQuery,
    bidsValidationQuery,

    // Error states
    uploadError: uploadMutation.error?.message,
    updateError: updateMutation.error?.message,
    deleteError: deleteMutation.error?.message,
    downloadError: downloadMutation.error?.message,
    analysisError: adhdAnalysisMutation.error?.message,

    // Success states
    uploadSuccess: uploadMutation.isSuccess,
    updateSuccess: updateMutation.isSuccess,
    deleteSuccess: deleteMutation.isSuccess,
    analysisSuccess: adhdAnalysisMutation.isSuccess,
  }
}