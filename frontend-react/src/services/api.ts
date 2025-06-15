import axios, { AxiosResponse, AxiosError } from 'axios'
import { useAuthStore } from '@/store/authStore'
import type { ApiResponse } from '@/types'

// Create axios instance
export const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const { response } = error

    // Handle 401 errors (unauthorized)
    if (response?.status === 401) {
      const { clearAuth } = useAuthStore.getState()
      clearAuth()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // Handle other HTTP errors
    if (response?.status) {
      const errorMessage = (response.data as any)?.message || 'An error occurred'
      return Promise.reject(new Error(errorMessage))
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      return Promise.reject(new Error('Network error. Please check your connection.'))
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. Please try again.'))
    }

    return Promise.reject(error)
  }
)

// Generic API response handler
export const handleApiResponse = <T>(response: AxiosResponse<T>): T => {
  return response.data
}

// Generic error handler
export const handleApiError = (error: any): never => {
  if (error instanceof Error) {
    throw error
  }
  if (typeof error === 'string') {
    throw new Error(error)
  }
  throw new Error('An unexpected error occurred')
}

// File upload API with progress tracking
export const createFileUploadApi = () => {
  const uploadApi = axios.create({
    baseURL: '/api',
    timeout: 300000, // 5 minutes for file uploads
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  // Add auth token
  uploadApi.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  return uploadApi
}

// Health check endpoint
export const healthCheck = async (): Promise<any> => {
  try {
    const response = await axios.get('/health')
    return handleApiResponse(response)
  } catch (error) {
    handleApiError(error)
  }
}

export default api