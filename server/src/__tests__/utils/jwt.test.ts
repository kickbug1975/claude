import { generateToken, verifyToken, TokenPayload } from '../../utils/jwt'

describe('JWT Utils', () => {
  const mockPayload: TokenPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'ADMIN',
  }

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should generate different tokens for different payloads', () => {
      const token1 = generateToken(mockPayload)
      const token2 = generateToken({ ...mockPayload, userId: 'user-456' })

      expect(token1).not.toBe(token2)
    })
  })

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(mockPayload)
      const decoded = verifyToken(token)

      expect(decoded.userId).toBe(mockPayload.userId)
      expect(decoded.email).toBe(mockPayload.email)
      expect(decoded.role).toBe(mockPayload.role)
    })

    it('should throw an error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow()
    })

    it('should throw an error for tampered token', () => {
      const token = generateToken(mockPayload)
      const tamperedToken = token.slice(0, -5) + 'xxxxx'

      expect(() => verifyToken(tamperedToken)).toThrow()
    })

    it('should include iat and exp in decoded token', () => {
      const token = generateToken(mockPayload)
      const decoded = verifyToken(token) as TokenPayload & { iat: number; exp: number }

      expect(decoded.iat).toBeDefined()
      expect(decoded.exp).toBeDefined()
      expect(decoded.exp).toBeGreaterThan(decoded.iat)
    })
  })

  describe('Token roundtrip', () => {
    it('should maintain payload integrity through generate and verify', () => {
      const roles = ['ADMIN', 'SUPERVISEUR', 'MONTEUR']

      roles.forEach((role) => {
        const payload: TokenPayload = {
          userId: `user-${role}`,
          email: `${role.toLowerCase()}@test.com`,
          role,
        }

        const token = generateToken(payload)
        const decoded = verifyToken(token)

        expect(decoded.userId).toBe(payload.userId)
        expect(decoded.email).toBe(payload.email)
        expect(decoded.role).toBe(payload.role)
      })
    })
  })
})
