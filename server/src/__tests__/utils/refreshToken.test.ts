import {
    generateRefreshToken,
    validateRefreshToken,
    revokeRefreshToken,
    revokeAllUserRefreshTokens,
} from '../../utils/refreshToken'
import { prisma } from '../../config/database'

describe('RefreshToken Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('generateRefreshToken', () => {
        it('should generate a refresh token for a user', async () => {
            const mockToken = {
                id: 'token-1',
                token: 'refresh-token-123',
                userId: 'user-1',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }

                ; (prisma.refreshToken.create as jest.Mock).mockResolvedValue(mockToken)

            const result = await generateRefreshToken('user-1')

            expect(result).toBe('refresh-token-123')
            expect(prisma.refreshToken.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        userId: 'user-1',
                        token: expect.any(String),
                        expiresAt: expect.any(Date),
                    }),
                })
            )
        })
    })

    describe('validateRefreshToken', () => {
        it('should validate and return user for valid token', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                role: 'ADMIN',
            }

            const mockToken = {
                id: 'token-1',
                token: 'valid-token',
                userId: 'user-1',
                expiresAt: new Date(Date.now() + 1000 * 60 * 60),
                user: mockUser,
            }

                ; (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(mockToken)

            const result = await validateRefreshToken('valid-token')

            expect(result).toEqual(mockUser)
        })

        it('should throw error for non-existent token', async () => {
            ; (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null)

            await expect(validateRefreshToken('invalid-token')).rejects.toThrow(
                'Refresh token invalide'
            )
        })

        it('should throw error for expired token', async () => {
            const mockToken = {
                id: 'token-1',
                token: 'expired-token',
                userId: 'user-1',
                expiresAt: new Date(Date.now() - 1000),
                user: { id: 'user-1' },
            }

                ; (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(mockToken)

            await expect(validateRefreshToken('expired-token')).rejects.toThrow(
                'Refresh token expiré'
            )
        })
    })

    describe('revokeRefreshToken', () => {
        it('should revoke a refresh token', async () => {
            ; (prisma.refreshToken.delete as jest.Mock).mockResolvedValue({
                id: 'token-1',
                token: 'token-to-revoke',
            })

            await revokeRefreshToken('token-to-revoke')

            expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
                where: { token: 'token-to-revoke' },
            })
        })
    })

    describe('revokeAllUserRefreshTokens', () => {
        it('should revoke all tokens for a user', async () => {
            ; (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 3 })

            await revokeAllUserRefreshTokens('user-1')

            expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: { userId: 'user-1' },
            })
        })
    })
})
