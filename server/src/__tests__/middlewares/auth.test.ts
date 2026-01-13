import { Request, Response, NextFunction } from 'express'
import { authenticate, authorize } from '../../middlewares/auth'
import { generateToken } from '../../utils/jwt'

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction

  beforeEach(() => {
    mockRequest = {
      headers: {},
    }
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    nextFunction = jest.fn()
  })

  describe('authenticate', () => {
    it('should return 401 if no authorization header', () => {
      authenticate(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token manquant ou invalide',
      })
      expect(nextFunction).not.toHaveBeenCalled()
    })

    it('should return 401 if authorization header does not start with Bearer', () => {
      mockRequest.headers = { authorization: 'Basic token123' }

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token manquant ou invalide',
      })
    })

    it('should return 401 for invalid token', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' }

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token invalide ou expiré',
      })
    })

    it('should call next() and set req.user for valid token', () => {
      const token = generateToken({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'ADMIN',
      })
      mockRequest.headers = { authorization: `Bearer ${token}` }

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(nextFunction).toHaveBeenCalled()
      expect(mockRequest.user).toBeDefined()
      expect(mockRequest.user?.userId).toBe('user-123')
      expect(mockRequest.user?.email).toBe('test@example.com')
      expect(mockRequest.user?.role).toBe('ADMIN')
    })
  })

  describe('authorize', () => {
    it('should return 401 if user is not authenticated', () => {
      const authorizeMiddleware = authorize('ADMIN')

      authorizeMiddleware(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Non authentifié',
      })
    })

    it('should return 403 if user role is not authorized', () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'MONTEUR',
      }
      const authorizeMiddleware = authorize('ADMIN', 'SUPERVISEUR')

      authorizeMiddleware(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Accès non autorisé pour ce rôle',
      })
    })

    it('should call next() if user role is authorized', () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'admin@example.com',
        role: 'ADMIN',
      }
      const authorizeMiddleware = authorize('ADMIN', 'SUPERVISEUR')

      authorizeMiddleware(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(nextFunction).toHaveBeenCalled()
    })

    it('should accept multiple roles', () => {
      const roles = ['ADMIN', 'SUPERVISEUR', 'MONTEUR']

      roles.forEach((role) => {
        mockRequest.user = {
          userId: 'user-123',
          email: 'test@example.com',
          role,
        }
        nextFunction = jest.fn()
        const authorizeMiddleware = authorize('ADMIN', 'SUPERVISEUR', 'MONTEUR')

        authorizeMiddleware(mockRequest as Request, mockResponse as Response, nextFunction)

        expect(nextFunction).toHaveBeenCalled()
      })
    })
  })
})
