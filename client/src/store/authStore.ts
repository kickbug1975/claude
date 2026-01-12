import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'
import { User, Monteur } from '../types'

interface AuthUser extends User {
  monteur?: Monteur | null
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/login', { email, password })
          const { user, token } = response.data.data

          localStorage.setItem('token', token)
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          return true
        } catch (error: any) {
          const message = error.response?.data?.message || 'Erreur de connexion'
          set({ isLoading: false, error: message })
          return false
        }
      },

      logout: () => {
        localStorage.removeItem('token')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token')
        if (!token) {
          set({ isAuthenticated: false, user: null })
          return
        }

        try {
          const response = await api.get('/auth/me')
          set({
            user: response.data.data,
            token,
            isAuthenticated: true,
          })
        } catch {
          localStorage.removeItem('token')
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
)
