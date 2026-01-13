/* eslint-disable @typescript-eslint/no-explicit-any */
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { env } from '../config/env'
import path from 'path'

// =====================================================
// Configuration Winston
// =====================================================

const { combine, timestamp, errors, json, printf, colorize, align } = winston.format

// Format personnalisé pour le développement (lisible, coloré)
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] ${message}`

  // Ajouter les métadonnées si présentes
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`
  }

  return msg
})

// Format pour la production (JSON structuré)
const prodFormat = combine(
  errors({ stack: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  json()
)

// Transports selon l'environnement
const transports: winston.transport[] = []

if (env.nodeEnv === 'development' || env.nodeEnv === 'test') {
  // Console pour le développement avec couleurs
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        align(),
        devFormat
      ),
    })
  )
} else {
  // Production: Fichiers avec rotation quotidienne

  // Logs combinés (tous les niveaux)
  transports.push(
    new DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d', // Garder 14 jours
      level: 'info',
      format: prodFormat,
    })
  )

  // Logs d'erreurs uniquement
  transports.push(
    new DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d', // Garder 30 jours pour les erreurs
      level: 'error',
      format: prodFormat,
    })
  )

  // Console minimaliste en production
  transports.push(
    new winston.transports.Console({
      level: 'info',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        json()
      ),
    })
  )
}

// Créer le logger Winston
const winstonLogger = winston.createLogger({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    success: 3, // Niveau personnalisé pour les succès
    debug: 4,
  },
  transports,
  exitOnError: false,
})

// Ajouter des couleurs personnalisées
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  http: 'magenta',
  success: 'green',
  debug: 'blue',
})

// =====================================================
// Classe Logger avec méthodes pratiques
// =====================================================

class Logger {
  private winstonLogger: winston.Logger

  constructor(winstonLogger: winston.Logger) {
    this.winstonLogger = winstonLogger
  }

  /**
   * Log de niveau info
   */
  info(message: string, metadata?: Record<string, any>) {
    this.winstonLogger.info(message, metadata)
  }

  /**
   * Log de niveau warn
   */
  warn(message: string, metadata?: Record<string, any>) {
    this.winstonLogger.warn(message, metadata)
  }

  /**
   * Log de niveau error
   */
  error(message: string, error?: Error | any, metadata?: Record<string, any>) {
    if (error instanceof Error) {
      this.winstonLogger.error(message, {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        ...metadata,
      })
    } else if (error && typeof error === 'object') {
      this.winstonLogger.error(message, { error, ...metadata })
    } else {
      this.winstonLogger.error(message, metadata)
    }
  }

  /**
   * Log de niveau success (personnalisé)
   */
  success(message: string, metadata?: Record<string, any>) {
    this.winstonLogger.log('success', message, metadata)
  }

  /**
   * Log de niveau debug
   */
  debug(message: string, metadata?: Record<string, any>) {
    this.winstonLogger.debug(message, metadata)
  }

  /**
   * Log de niveau http (pour les requêtes HTTP)
   */
  http(message: string, metadata?: Record<string, any>) {
    this.winstonLogger.http(message, metadata)
  }

  /**
   * Créer un logger enfant avec des métadonnées par défaut
   * Utile pour ajouter un contexte (request ID, user ID, etc.)
   */
  child(defaultMetadata: Record<string, any>) {
    return new Logger(this.winstonLogger.child(defaultMetadata))
  }

  /**
   * Accès direct au logger Winston si nécessaire
   */
  getWinstonLogger() {
    return this.winstonLogger
  }
}

export const logger = new Logger(winstonLogger)

// Stream pour Morgan (logging HTTP)
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim())
  },
}
