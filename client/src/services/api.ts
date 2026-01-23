import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important pour recevoir les cookies CSRF
})

// Variable pour stocker le token CSRF
let csrfToken: string | null = null

/**
 * Récupère le token CSRF depuis le serveur
 */
export const fetchCsrfToken = async (): Promise<string> => {
  try {
    const response = await axios.get(`${API_URL.replace('/api', '')}/api/csrf-token`, {
      withCredentials: true,
    })
    const token = response.data.csrfToken
    if (!token) {
      throw new Error('Token CSRF non reçu du serveur')
    }
    csrfToken = token
    return token
  } catch (error) {
    console.error('Erreur lors de la récupération du token CSRF:', error)
    throw error
  }
}

// Intercepteur pour ajouter le token JWT et CSRF
api.interceptors.request.use(
  async (config) => {
    // Ajouter le token JWT
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Ajouter le token CSRF pour les méthodes mutantes
    const mutateMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
    if (config.method && mutateMethods.includes(config.method.toUpperCase())) {
      // Si on n'a pas de token CSRF, le récupérer
      if (!csrfToken) {
        try {
          await fetchCsrfToken()
        } catch (error) {
          console.error('Impossible de récupérer le token CSRF')
        }
      }

      if (csrfToken) {
        config.headers['x-csrf-token'] = csrfToken
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Token JWT expiré ou invalide - Essayer de rafraîchir
    if (error.response?.status === 401 && !originalRequest._retryAuth) {
      originalRequest._retryAuth = true

      const refreshToken = localStorage.getItem('refreshToken')

      if (refreshToken && originalRequest.url !== '/auth/refresh') {
        try {
          // Rafraîchir le token
          const response = await api.post('/api/auth/refresh', { refreshToken })
          const { token: newToken, refreshToken: newRefreshToken } = response.data.data

          // Sauvegarder les nouveaux tokens
          localStorage.setItem('token', newToken)
          localStorage.setItem('refreshToken', newRefreshToken)

          // Réessayer la requête originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        } catch (refreshError: any) {
          // Si c'est une erreur réseau, on ne déconnecte PAS !
          if (!refreshError.response) {
            console.warn('Echec refresh token (Réseau), conservation session')
            return Promise.reject(refreshError)
          }

          // Si le refresh échoue avec une réponse serveur (ex: 401 token invalide), déconnecter
          console.error('Session expirée ou invalide', refreshError)
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          return Promise.reject(refreshError)
        }
      } else {
        // Pas de refresh token ou refresh échoué, déconnecter
        // ATTENTION: Si on est juste offline mais qu'on a un refresh token, on ne devrait pas passer ici
        // car le if(refreshToken) au dessus l'aurait attrapé.
        // Ici c'est si on n'a PAS de refreshToken du tout.
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
      }
    }

    // Token CSRF invalide - Réessayer avec un nouveau token
    if (error.response?.status === 403 && error.response?.data?.error === 'CSRF_VALIDATION_FAILED') {
      if (!originalRequest._retryCsrf) {
        originalRequest._retryCsrf = true

        try {
          // Récupérer un nouveau token CSRF
          await fetchCsrfToken()

          // Réessayer la requête avec le nouveau token
          if (csrfToken) {
            originalRequest.headers['x-csrf-token'] = csrfToken
          }

          return api(originalRequest)
        } catch (csrfError) {
          console.error('Impossible de renouveler le token CSRF')
          return Promise.reject(csrfError)
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api
