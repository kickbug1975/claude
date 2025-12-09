/* eslint-disable @typescript-eslint/no-explicit-any */
import { env } from '../config/env'

type LogLevel = 'info' | 'warn' | 'error' | 'success'

const colors = {
  info: '\x1b[36m',    // Cyan
  warn: '\x1b[33m',    // Yellow
  error: '\x1b[31m',   // Red
  success: '\x1b[32m', // Green
  reset: '\x1b[0m',
}

class Logger {
  private log(level: LogLevel, message: string, ...args: any[]) {
    if (env.nodeEnv === 'test') return

    const timestamp = new Date().toISOString()
    const color = colors[level]
    const reset = colors.reset

    console.log(`${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`, ...args)
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args)
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args)
  }

  error(message: string, ...args: any[]) {
    this.log('error', message, ...args)
  }

  success(message: string, ...args: any[]) {
    this.log('success', message, ...args)
  }
}

export const logger = new Logger()
