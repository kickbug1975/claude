"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const refreshToken_1 = require("../../utils/refreshToken");
const database_1 = require("../../config/database");
describe('RefreshToken Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('generateRefreshToken', () => {
        it('should generate a refresh token for a user', async () => {
            const mockToken = {
                id: 'token-1',
                token: 'refresh-token-123',
                userId: 'user-1',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            };
            database_1.prisma.refreshToken.create.mockResolvedValue(mockToken);
            const result = await (0, refreshToken_1.generateRefreshToken)('user-1');
            expect(result).toBe('refresh-token-123');
            expect(database_1.prisma.refreshToken.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    userId: 'user-1',
                    token: expect.any(String),
                    expiresAt: expect.any(Date),
                }),
            }));
        });
    });
    describe('validateRefreshToken', () => {
        it('should validate and return user for valid token', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                role: 'ADMIN',
            };
            const mockToken = {
                id: 'token-1',
                token: 'valid-token',
                userId: 'user-1',
                expiresAt: new Date(Date.now() + 1000 * 60 * 60),
                user: mockUser,
            };
            database_1.prisma.refreshToken.findUnique.mockResolvedValue(mockToken);
            const result = await (0, refreshToken_1.validateRefreshToken)('valid-token');
            expect(result).toEqual(mockUser);
        });
        it('should throw error for non-existent token', async () => {
            ;
            database_1.prisma.refreshToken.findUnique.mockResolvedValue(null);
            await expect((0, refreshToken_1.validateRefreshToken)('invalid-token')).rejects.toThrow('Refresh token invalide');
        });
        it('should throw error for expired token', async () => {
            const mockToken = {
                id: 'token-1',
                token: 'expired-token',
                userId: 'user-1',
                expiresAt: new Date(Date.now() - 1000),
                user: { id: 'user-1' },
            };
            database_1.prisma.refreshToken.findUnique.mockResolvedValue(mockToken);
            await expect((0, refreshToken_1.validateRefreshToken)('expired-token')).rejects.toThrow('Refresh token expiré');
        });
    });
    describe('revokeRefreshToken', () => {
        it('should revoke a refresh token', async () => {
            ;
            database_1.prisma.refreshToken.delete.mockResolvedValue({
                id: 'token-1',
                token: 'token-to-revoke',
            });
            await (0, refreshToken_1.revokeRefreshToken)('token-to-revoke');
            expect(database_1.prisma.refreshToken.delete).toHaveBeenCalledWith({
                where: { token: 'token-to-revoke' },
            });
        });
    });
    describe('revokeAllUserRefreshTokens', () => {
        it('should revoke all tokens for a user', async () => {
            ;
            database_1.prisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });
            await (0, refreshToken_1.revokeAllUserRefreshTokens)('user-1');
            expect(database_1.prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: { userId: 'user-1' },
            });
        });
    });
});
//# sourceMappingURL=refreshToken.test.js.map