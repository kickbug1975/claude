import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface TokenPayload {
  userId: string
  email: string
  role: string
}

export const generateToken = (payload: TokenPayload): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as any)
}

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtSecret) as TokenPayload
}
