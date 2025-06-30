import api, { handleApiResponse, handleApiError } from './api'
import type { 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse, 
  User, 
  ChangePasswordRequest 
} from '@/types'

export const authService = {
  // Login user
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      console.log('🔐 Attempting login for:', credentials.email)
      const response = await api.post<LoginResponse>('/auth/login', credentials)
      console.log('✅ Login successful for:', credentials.email)
      return handleApiResponse(response)
    } catch (error) {
      console.error('❌ Login failed for:', credentials.email, error)
      return handleApiError(error)
    }
  },

  // Register new user
  register: async (userData: RegisterRequest): Promise<User> => {
    try {
      console.log('📝 Attempting registration for:', userData.email)
      const response = await api.post<User>('/auth/register', userData)
      console.log('✅ Registration successful for:', userData.email)
      return handleApiResponse(response)
    } catch (error) {
      console.error('❌ Registration failed for:', userData.email, error)
      return handleApiError(error)
    }
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    try {
      const response = await api.get<User>('/auth/profile')
      return handleApiResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/refresh', { refreshToken })
      return handleApiResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Don't throw error for logout - we want to clear local state regardless
      console.warn('Logout request failed:', error)
    }
  },

  // Validate token
  validateToken: async (): Promise<{ valid: boolean; userId?: string; email?: string }> => {
    try {
      const response = await api.get('/auth/validate')
      return handleApiResponse(response)
    } catch (error) {
      // Return invalid if validation fails
      return { valid: false }
    }
  },

  // Change password
  changePassword: async (passwordData: ChangePasswordRequest): Promise<void> => {
    try {
      await api.post('/user/me/change-password', passwordData)
    } catch (error) {
      return handleApiError(error)
    }
  },

  // Update user profile
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    try {
      const response = await api.put<User>('/user/me', userData)
      return handleApiResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  },
}