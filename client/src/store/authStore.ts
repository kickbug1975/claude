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
  isSetupComplete: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshAccessToken: () => Promise<boolean>
  checkAuth: () => Promise<void>
  checkSetup: () => Promise<void>
  initialCheck: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isSetupComplete: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/api/auth/login', { email, password })
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

          // Vérifier le statut de setup après login
          await get().checkSetup()
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
            await api.post('/api/auth/logout', { refreshToken })
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
          // Ne pas réinitialiser isSetupComplete - c'est un état global de l'application
          error: null,
        })

        // Redirection handled by App.tsx observing isAuthenticated state
        // window.location.href = '/login'
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get()

        if (!refreshToken) {
          return false
        }

        try {
          const response = await api.post('/api/auth/refresh', { refreshToken })
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
          set({ isAuthenticated: false, user: null, isSetupComplete: false })
          return
        }

        try {
          const response = await api.get('/api/auth/me')
          const user = response.data.data
          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
          })

          // Vérifier le statut de setup après checkAuth
          await get().checkSetup()
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

          // IMPORTANT: Ne PAS déconnecter si c'est une erreur réseau !
          // On suppose que si on a un token et qu'on est hors ligne, on est authentifié (Offline Mode)
          if (!error.response && get().user) {
            console.warn('Erreur réseau lors du checkAuth, mode hors-ligne activé')
            // On garde l'état authentifié
            set({ isAuthenticated: true, isLoading: false })
            return
          }

          // Sinon, déconnecter (Token invalide ou expiré et refresh échoué)
          console.error('Echec authentification, déconnexion', error)
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isSetupComplete: false,
            error: null,
          })
        }
      },

      checkSetup: async () => {
        try {
          const response = await api.get('/api/setup/status')
          set({ isSetupComplete: response.data.data.isSetupComplete })
        } catch (error) {
          console.error('Erreur checkSetup:', error)
        }
      },

      initialCheck: async () => {
        try {
          const response = await api.get('/api/setup/status')
          set({ isSetupComplete: response.data.data.isSetupComplete })
        } catch (error) {
          console.error('Erreur initialCheck:', error)
          // Par défaut on considère que c'est ok pour éviter de bloquer l'app en cas d'erreur API
          set({ isSetupComplete: true })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, refreshToken: state.refreshToken, user: state.user }),
    }
  )
)
