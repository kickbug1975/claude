import { Request, Response, NextFunction } from 'express'
import { env } from '../config/env'
import { logger } from '../utils/logger'

export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Error:', err.message)

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(env.nodeEnv === 'development' && { stack: err.stack }),
    })
  }

  // Erreur inconnue
  return res.status(500).json({
    success: false,
    message: 'Une erreur interne est survenue',
    ...(env.nodeEnv === 'development' && { error: err.message, stack: err.stack }),
  })
}
