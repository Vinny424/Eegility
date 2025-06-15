import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LoginResponse } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  setAuth: (authData: LoginResponse) => void
  setUser: (user: User) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateUser: (userData: Partial<User>) => void
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAuth: (authData: LoginResponse) => {
        set({
          user: authData.user,
          token: authData.token,
          refreshToken: authData.refreshToken,
          isAuthenticated: true,
          error: null,
        })
      },

      setUser: (user: User) => {
        set({ user })
      },

      clearAuth: () => {
        set(initialState)
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setError: (error: string | null) => {
        set({ error })
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({
            user: { ...user, ...userData }
          })
        }
      },
    }),
    {
      name: 'eegility-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)