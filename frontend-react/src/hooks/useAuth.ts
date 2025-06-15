import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import type { LoginRequest, RegisterRequest, ChangePasswordRequest } from '@/types'

export const useAuth = () => {
  const queryClient = useQueryClient()
  const { 
    user, 
    token, 
    isAuthenticated, 
    isLoading, 
    error, 
    setAuth, 
    clearAuth, 
    setLoading, 
    setError,
    updateUser
  } = useAuthStore()

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onMutate: () => {
      setLoading(true)
      setError(null)
    },
    onSuccess: (data) => {
      setAuth(data)
      setLoading(false)
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
    },
    onError: (error: Error) => {
      setError(error.message)
      setLoading(false)
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onMutate: () => {
      setLoading(true)
      setError(null)
    },
    onSuccess: () => {
      setLoading(false)
    },
    onError: (error: Error) => {
      setError(error.message)
      setLoading(false)
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      clearAuth()
      queryClient.clear()
    },
    onError: () => {
      // Clear auth even if logout fails
      clearAuth()
      queryClient.clear()
    },
  })

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => {
      // Password changed successfully
    },
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      queryClient.setQueryData(['user', 'profile'], updatedUser)
    },
  })

  // Get profile query
  const profileQuery = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: authService.getProfile,
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })

  // Validate token query
  const tokenValidationQuery = useQuery({
    queryKey: ['auth', 'validate'],
    queryFn: authService.validateToken,
    enabled: !!token,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false,
  })

  // Helper functions
  const login = (credentials: LoginRequest) => {
    return loginMutation.mutateAsync(credentials)
  }

  const register = (userData: RegisterRequest) => {
    return registerMutation.mutateAsync(userData)
  }

  const logout = () => {
    logoutMutation.mutate()
  }

  const changePassword = (passwordData: ChangePasswordRequest) => {
    return changePasswordMutation.mutateAsync(passwordData)
  }

  const updateProfile = (userData: Partial<typeof user>) => {
    return updateProfileMutation.mutateAsync(userData)
  }

  const isValidToken = tokenValidationQuery.data?.valid ?? false

  return {
    // State
    user,
    token,
    isAuthenticated: isAuthenticated && isValidToken,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    error: error || loginMutation.error?.message || registerMutation.error?.message,
    
    // Profile data
    profile: profileQuery.data,
    isProfileLoading: profileQuery.isLoading,
    profileError: profileQuery.error?.message,

    // Actions
    login,
    register,
    logout,
    changePassword,
    updateProfile,
    clearError: () => setError(null),

    // Mutation states
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
    isChangePasswordPending: changePasswordMutation.isPending,
    isUpdateProfilePending: updateProfileMutation.isPending,

    // Error states
    loginError: loginMutation.error?.message,
    registerError: registerMutation.error?.message,
    changePasswordError: changePasswordMutation.error?.message,
    updateProfileError: updateProfileMutation.error?.message,

    // Success states
    isLoginSuccess: loginMutation.isSuccess,
    isRegisterSuccess: registerMutation.isSuccess,
    isChangePasswordSuccess: changePasswordMutation.isSuccess,
    isUpdateProfileSuccess: updateProfileMutation.isSuccess,
  }
}