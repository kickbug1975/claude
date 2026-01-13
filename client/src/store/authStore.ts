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
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshAccessToken: () => Promise<boolean>
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/login', { email, password })
          const { user, token, refreshToken } = response.data.data

          localStorage.setItem('token', token)
          localStorage.setItem('refreshToken', refreshToken)

          set({
            user,
            token,
            refreshToken,
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

      logout: async () => {
        const { refreshToken } = get()

        // Révoquer le refresh token côté serveur
        if (refreshToken) {
          try {
            await api.post('/auth/logout', { refreshToken })
          } catch (error) {
            console.error('Erreur lors de la révocation du token:', error)
          }
        }

        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        })
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get()

        if (!refreshToken) {
          return false
        }

        try {
          const response = await api.post('/auth/refresh', { refreshToken })
          const { token: newToken, refreshToken: newRefreshToken } = response.data.data

          localStorage.setItem('token', newToken)
          localStorage.setItem('refreshToken', newRefreshToken)

          set({
            token: newToken,
            refreshToken: newRefreshToken,
          })

          return true
        } catch (error) {
          console.error('Erreur lors du rafraîchissement du token:', error)
          // Si le refresh échoue, déconnecter l'utilisateur
          get().logout()
          return false
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token')
        const refreshToken = localStorage.getItem('refreshToken')

        if (!token) {
          set({ isAuthenticated: false, user: null })
          return
        }

        try {
          const response = await api.get('/auth/me')
          set({
            user: response.data.data,
            token,
            refreshToken,
            isAuthenticated: true,
          })
        } catch (error: any) {
          // Si l'erreur est 401, essayer de rafraîchir le token
          if (error.response?.status === 401 && refreshToken) {
            const refreshed = await get().refreshAccessToken()
            if (refreshed) {
              // Réessayer checkAuth après le rafraîchissement
              await get().checkAuth()
              return
            }
          }

          // Sinon, déconnecter
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, refreshToken: state.refreshToken }),
    }
  )
)
