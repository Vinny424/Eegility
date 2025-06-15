import { create } from 'zustand'
import type { EegData, SearchParams, LoadingState } from '@/types'

interface EegDataState {
  eegDataList: EegData[]
  selectedEegData: EegData | null
  searchParams: SearchParams
  loadingState: LoadingState
  pagination: {
    currentPage: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
  uploadProgress: {
    [fileId: string]: number
  }
}

interface EegDataActions {
  setEegDataList: (data: EegData[]) => void
  addEegData: (data: EegData) => void
  updateEegData: (id: string, data: Partial<EegData>) => void
  removeEegData: (id: string) => void
  setSelectedEegData: (data: EegData | null) => void
  setSearchParams: (params: Partial<SearchParams>) => void
  setLoadingState: (state: Partial<LoadingState>) => void
  setPagination: (pagination: Partial<EegDataState['pagination']>) => void
  setUploadProgress: (fileId: string, progress: number) => void
  clearUploadProgress: (fileId: string) => void
  clearAll: () => void
}

type EegDataStore = EegDataState & EegDataActions

const initialState: EegDataState = {
  eegDataList: [],
  selectedEegData: null,
  searchParams: {},
  loadingState: {
    isLoading: false,
    error: undefined,
  },
  pagination: {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  },
  uploadProgress: {},
}

export const useEegDataStore = create<EegDataStore>((set, get) => ({
  ...initialState,

  setEegDataList: (data: EegData[]) => {
    set({ eegDataList: data })
  },

  addEegData: (data: EegData) => {
    const { eegDataList } = get()
    set({ eegDataList: [data, ...eegDataList] })
  },

  updateEegData: (id: string, data: Partial<EegData>) => {
    const { eegDataList } = get()
    const updatedList = eegDataList.map((item) =>
      item.id === id ? { ...item, ...data } : item
    )
    set({ eegDataList: updatedList })

    // Update selected data if it matches
    const { selectedEegData } = get()
    if (selectedEegData && selectedEegData.id === id) {
      set({ selectedEegData: { ...selectedEegData, ...data } })
    }
  },

  removeEegData: (id: string) => {
    const { eegDataList, selectedEegData } = get()
    const filteredList = eegDataList.filter((item) => item.id !== id)
    set({ eegDataList: filteredList })

    // Clear selected data if it was removed
    if (selectedEegData && selectedEegData.id === id) {
      set({ selectedEegData: null })
    }
  },

  setSelectedEegData: (data: EegData | null) => {
    set({ selectedEegData: data })
  },

  setSearchParams: (params: Partial<SearchParams>) => {
    const { searchParams } = get()
    set({ searchParams: { ...searchParams, ...params } })
  },

  setLoadingState: (state: Partial<LoadingState>) => {
    const { loadingState } = get()
    set({ loadingState: { ...loadingState, ...state } })
  },

  setPagination: (pagination: Partial<EegDataState['pagination']>) => {
    const currentPagination = get().pagination
    set({ pagination: { ...currentPagination, ...pagination } })
  },

  setUploadProgress: (fileId: string, progress: number) => {
    const { uploadProgress } = get()
    set({
      uploadProgress: {
        ...uploadProgress,
        [fileId]: progress,
      },
    })
  },

  clearUploadProgress: (fileId: string) => {
    const { uploadProgress } = get()
    const { [fileId]: removed, ...rest } = uploadProgress
    set({ uploadProgress: rest })
  },

  clearAll: () => {
    set(initialState)
  },
}))