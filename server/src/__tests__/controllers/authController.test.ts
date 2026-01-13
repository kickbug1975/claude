import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { login, register, me } from '../../controllers/authController'
import { prisma } from '../../config/database'

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>

  beforeEach(() => {
    mockRequest = {
      body: {},
      user: undefined,
    }
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    jest.clearAllMocks()
  })

  describe('login', () => {
    it('should return 400 for invalid email format', async () => {
      mockRequest.body = { email: 'invalid-email', password: 'password123' }

      await login(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Données invalides',
        })
      )
    })

    it('should return 400 for missing password', async () => {
      mockRequest.body = { email: 'test@example.com', password: '' }

      await login(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Données invalides',
        })
      )
    })

    it('should return 401 for non-existent user', async () => {
      mockRequest.body = { email: 'notfound@example.com', password: 'password123' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await login(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email ou mot de passe incorrect',
      })
    })

    it('should return 401 for incorrect password', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'wrongpassword' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'ADMIN',
      })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await login(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email ou mot de passe incorrect',
      })
    })

    it('should return 200 with token for valid credentials', async () => {
      mockRequest.body = { email: 'admin@example.com', password: 'Admin123!' }
      const mockUser = {
        id: 'user-123',
        email: 'admin@example.com',
        password: 'hashed-password',
        role: 'ADMIN',
        monteurId: null,
        monteur: null,
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await login(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Connexion réussie',
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: 'user-123',
              email: 'admin@example.com',
              role: 'ADMIN',
            }),
            token: expect.any(String),
          }),
        })
      )
    })
  })

  describe('register', () => {
    it('should return 400 for invalid email', async () => {
      mockRequest.body = { email: 'invalid', password: 'Password123!' }

      await register(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Données invalides',
        })
      )
    })

    it('should return 400 for password too short', async () => {
      mockRequest.body = { email: 'test@example.com', password: '123' }

      await register(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Données invalides',
        })
      )
    })

    it('should return 409 if email already exists', async () => {
      mockRequest.body = { email: 'existing@example.com', password: 'Password123!' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com',
      })

      await register(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(409)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cet email est déjà utilisé',
      })
    })

    it('should return 201 for successful registration', async () => {
      mockRequest.body = { email: 'new@example.com', password: 'Password123!' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user-123',
        email: 'new@example.com',
        role: 'MONTEUR',
      })

      await register(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Inscription réussie',
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: 'new@example.com',
              role: 'MONTEUR',
            }),
            token: expect.any(String),
          }),
        })
      )
    })

    it('should accept custom role during registration', async () => {
      mockRequest.body = {
        email: 'supervisor@example.com',
        password: 'Password123!',
        role: 'SUPERVISEUR',
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user-456',
        email: 'supervisor@example.com',
        role: 'SUPERVISEUR',
      })

      await register(mockRequest as Request, mockResponse as Response)

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'SUPERVISEUR',
          }),
        })
      )
    })
  })

  describe('me', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined

      await me(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Non authentifié',
      })
    })

    it('should return 404 if user not found in database', async () => {
      mockRequest.user = {
        userId: 'nonexistent-user',
        email: 'test@example.com',
        role: 'ADMIN',
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await me(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    })

    it('should return 200 with user data for authenticated user', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'admin@example.com',
        role: 'ADMIN',
      }
      const mockUser = {
        id: 'user-123',
        email: 'admin@example.com',
        role: 'ADMIN',
        monteurId: null,
        monteur: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      await me(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: 'user-123',
            email: 'admin@example.com',
            role: 'ADMIN',
          }),
        })
      )
    })
  })
})
