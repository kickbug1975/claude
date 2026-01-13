import { Request, Response, NextFunction } from 'express'
import { randomBytes, createHmac } from 'crypto'
import { env } from '../config/env'

// Map pour stocker les tokens CSRF (en production, utiliser Redis)
const csrfTokens = new Map<string, { token: string; expires: number }>()

// Nettoyer les tokens expirés toutes les heures
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expires < now) {
      csrfTokens.delete(key)
    }
  }
}, 60 * 60 * 1000)

/**
 * Génère un token CSRF sécurisé
 */
function generateToken(sessionId: string): string {
  const token = randomBytes(32).toString('hex')
  const expires = Date.now() + 24 * 60 * 60 * 1000 // 24 heures

  csrfTokens.set(sessionId, { token, expires })

  return token
}

/**
 * Valide un token CSRF
 */
function validateToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId)

  if (!stored) {
    return false
  }

  if (stored.expires < Date.now()) {
    csrfTokens.delete(sessionId)
    return false
  }

  return stored.token === token
}

/**
 * Obtient l'identifiant de session depuis la requête
 */
function getSessionId(req: Request): string {
  // Utiliser l'IP + User-Agent comme identifiant de session
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const userAgent = req.headers['user-agent'] || 'unknown'

  return createHmac('sha256', env.jwtSecret)
    .update(`${ip}-${userAgent}`)
    .digest('hex')
}

/**
 * Middleware pour générer et envoyer le token CSRF au client
 */
export const generateCsrfToken = (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const sessionId = getSessionId(req)
    const token = generateToken(sessionId)

    res.json({
      success: true,
      csrfToken: token,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Impossible de générer le token CSRF',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Middleware de protection CSRF
 * À appliquer sur les routes nécessitant une protection
 */
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Exempter les méthodes GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }

  const sessionId = getSessionId(req)
  const token = req.headers['x-csrf-token'] as string

  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'Token CSRF manquant',
      error: 'CSRF_VALIDATION_FAILED',
    })
  }

  if (!validateToken(sessionId, token)) {
    return res.status(403).json({
      success: false,
      message: 'Token CSRF invalide ou expiré',
      error: 'CSRF_VALIDATION_FAILED',
    })
  }

  next()
}

/**
 * Middleware d'erreur CSRF personnalisé
 */
export const csrfErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err.code === 'EBADCSRFTOKEN' || err.message?.includes('csrf')) {
    res.status(403).json({
      success: false,
      message: 'Token CSRF invalide ou manquant',
      error: 'CSRF_VALIDATION_FAILED',
    })
    return
  }
  next(err)
}
