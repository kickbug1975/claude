import { act } from '@testing-library/react'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'

// Mock the API module
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}))

const mockPost = api.post as jest.Mock
const mockGet = api.get as jest.Mock

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { logout } = useAuthStore.getState()
    logout()
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('Initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState()

      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('login', () => {
    it('should set loading state during login', async () => {
      mockPost.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { login } = useAuthStore.getState()

      // Start login without awaiting
      login('test@example.com', 'password')

      // Check loading state immediately
      const state = useAuthStore.getState()
      expect(state.isLoading).toBe(true)
      expect(state.error).toBeNull()
    })

    it('should set user and token on successful login', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'ADMIN',
      }
      const mockToken = 'jwt-token-123'

      mockPost.mockResolvedValue({
        data: {
          data: {
            user: mockUser,
            token: mockToken,
          },
        },
      })

      const { login } = useAuthStore.getState()

      await act(async () => {
        const result = await login('test@example.com', 'password')
        expect(result).toBe(true)
      })

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe(mockToken)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken)
    })

    it('should set error on failed login', async () => {
      mockPost.mockRejectedValue({
        response: {
          data: {
            message: 'Email ou mot de passe incorrect',
          },
        },
      })

      const { login } = useAuthStore.getState()

      await act(async () => {
        const result = await login('test@example.com', 'wrongpassword')
        expect(result).toBe(false)
      })

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBe('Email ou mot de passe incorrect')
    })

    it('should use default error message when no response message', async () => {
      mockPost.mockRejectedValue(new Error('Network error'))

      const { login } = useAuthStore.getState()

      await act(async () => {
        await login('test@example.com', 'password')
      })

      const state = useAuthStore.getState()
      expect(state.error).toBe('Erreur de connexion')
    })
  })

  describe('logout', () => {
    it('should clear user state and token', async () => {
      // First, set up authenticated state
      mockPost.mockResolvedValue({
        data: {
          data: {
            user: { id: 'user-123', email: 'test@example.com', role: 'ADMIN' },
            token: 'jwt-token',
          },
        },
      })

      const store = useAuthStore.getState()
      await store.login('test@example.com', 'password')

      // Now logout
      act(() => {
        store.logout()
      })

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')
    })
  })

  describe('checkAuth', () => {
    it('should set isAuthenticated to false if no token', async () => {
      ;(localStorage.getItem as jest.Mock).mockReturnValue(null)

      const { checkAuth } = useAuthStore.getState()

      await act(async () => {
        await checkAuth()
      })

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
    })

    it('should verify token and set user data on success', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'MONTEUR',
      }
      ;(localStorage.getItem as jest.Mock).mockReturnValue('valid-token')
      mockGet.mockResolvedValue({
        data: {
          data: mockUser,
        },
      })

      const { checkAuth } = useAuthStore.getState()

      await act(async () => {
        await checkAuth()
      })

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe('valid-token')
    })

    it('should clear state on invalid token', async () => {
      ;(localStorage.getItem as jest.Mock).mockReturnValue('invalid-token')
      mockGet.mockRejectedValue(new Error('Unauthorized'))

      const { checkAuth } = useAuthStore.getState()

      await act(async () => {
        await checkAuth()
      })

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      // First set an error
      mockPost.mockRejectedValue({
        response: { data: { message: 'Some error' } },
      })

      const store = useAuthStore.getState()
      await store.login('test@example.com', 'password')

      expect(useAuthStore.getState().error).toBe('Some error')

      // Now clear the error
      act(() => {
        store.clearError()
      })

      expect(useAuthStore.getState().error).toBeNull()
    })
  })
})
