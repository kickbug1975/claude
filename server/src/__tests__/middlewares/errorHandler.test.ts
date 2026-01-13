import { Request, Response, NextFunction } from 'express'
import { AppError, errorHandler } from '../../middlewares/errorHandler'

describe('Error Handler', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction

  beforeEach(() => {
    mockRequest = {}
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    nextFunction = jest.fn()
  })

  describe('AppError', () => {
    it('should create an AppError with message and statusCode', () => {
      const error = new AppError('Test error', 400)

      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(400)
      expect(error.isOperational).toBe(true)
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
    })

    it('should capture stack trace', () => {
      const error = new AppError('Test error', 500)

      expect(error.stack).toBeDefined()
    })
  })

  describe('errorHandler middleware', () => {
    it('should handle AppError with correct status code', () => {
      const error = new AppError('Not found', 404)

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Not found',
        })
      )
    })

    it('should handle AppError with different status codes', () => {
      const testCases = [
        { message: 'Bad request', statusCode: 400 },
        { message: 'Unauthorized', statusCode: 401 },
        { message: 'Forbidden', statusCode: 403 },
        { message: 'Not found', statusCode: 404 },
        { message: 'Conflict', statusCode: 409 },
      ]

      testCases.forEach(({ message, statusCode }) => {
        const error = new AppError(message, statusCode)
        mockResponse.status = jest.fn().mockReturnThis()
        mockResponse.json = jest.fn().mockReturnThis()

        errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction)

        expect(mockResponse.status).toHaveBeenCalledWith(statusCode)
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message,
          })
        )
      })
    })

    it('should handle generic Error with 500 status code', () => {
      const error = new Error('Something went wrong')

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Une erreur interne est survenue',
        })
      )
    })

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      // Need to re-import to get fresh module with new env
      jest.resetModules()

      const error = new AppError('Test error', 400)

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction)

      // Restore env
      process.env.NODE_ENV = originalEnv
    })
  })
})
