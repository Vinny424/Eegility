import axios, { AxiosResponse, AxiosError } from 'axios'
import { useAuthStore } from '@/store/authStore'

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
    console.log('✅ API Success:', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
      data: response.data
    })
    return response
  },
  async (error: AxiosError) => {
    const { response, config } = error

    // Enhanced error logging
    console.error('❌ API Error:', {
      method: config?.method?.toUpperCase(),
      url: config?.url,
      status: response?.status,
      statusText: response?.statusText,
      data: response?.data,
      message: error.message,
      code: error.code,
      stack: error.stack
    })

    // Handle 401 errors (unauthorized)
    if (response?.status === 401) {
      console.warn('🔒 Unauthorized - clearing auth and redirecting to login')
      const { clearAuth } = useAuthStore.getState()
      clearAuth()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // Handle 500 errors with detailed logging
    if (response?.status === 500) {
      console.error('🔥 Internal Server Error Details:', {
        url: config?.url,
        method: config?.method,
        requestData: config?.data,
        responseData: response?.data,
        headers: response?.headers
      })
      const errorMessage = (response.data as any)?.message || 'Internal server error occurred'
      return Promise.reject(new Error(`Server Error (500): ${errorMessage}`))
    }

    // Handle other HTTP errors
    if (response?.status) {
      const errorMessage = (response.data as any)?.message || `HTTP Error ${response.status}`
      console.error(`📡 HTTP ${response.status} Error:`, errorMessage)
      return Promise.reject(new Error(`${response.status}: ${errorMessage}`))
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('🌐 Network Error - backend may be down or unreachable')
      return Promise.reject(new Error('Network error. Please check your connection and ensure the backend is running.'))
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request Timeout')
      return Promise.reject(new Error('Request timeout. Please try again.'))
    }

    // Handle other errors
    console.error('❓ Unknown Error:', error)
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