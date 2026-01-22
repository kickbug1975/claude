"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_1 = require("../../utils/jwt");
describe('JWT Utils', () => {
    const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'ADMIN',
    };
    describe('generateToken', () => {
        it('should generate a valid JWT token', () => {
            const token = (0, jwt_1.generateToken)(mockPayload);
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });
        it('should generate different tokens for different payloads', () => {
            const token1 = (0, jwt_1.generateToken)(mockPayload);
            const token2 = (0, jwt_1.generateToken)({ ...mockPayload, userId: 'user-456' });
            expect(token1).not.toBe(token2);
        });
    });
    describe('verifyToken', () => {
        it('should verify and decode a valid token', () => {
            const token = (0, jwt_1.generateToken)(mockPayload);
            const decoded = (0, jwt_1.verifyToken)(token);
            expect(decoded.userId).toBe(mockPayload.userId);
            expect(decoded.email).toBe(mockPayload.email);
            expect(decoded.role).toBe(mockPayload.role);
        });
        it('should throw an error for invalid token', () => {
            expect(() => (0, jwt_1.verifyToken)('invalid-token')).toThrow();
        });
        it('should throw an error for tampered token', () => {
            const token = (0, jwt_1.generateToken)(mockPayload);
            const tamperedToken = token.slice(0, -5) + 'xxxxx';
            expect(() => (0, jwt_1.verifyToken)(tamperedToken)).toThrow();
        });
        it('should include iat and exp in decoded token', () => {
            const token = (0, jwt_1.generateToken)(mockPayload);
            const decoded = (0, jwt_1.verifyToken)(token);
            expect(decoded.iat).toBeDefined();
            expect(decoded.exp).toBeDefined();
            expect(decoded.exp).toBeGreaterThan(decoded.iat);
        });
    });
    describe('Token roundtrip', () => {
        it('should maintain payload integrity through generate and verify', () => {
            const roles = ['ADMIN', 'SUPERVISEUR', 'MONTEUR'];
            roles.forEach((role) => {
                const payload = {
                    userId: `user-${role}`,
                    email: `${role.toLowerCase()}@test.com`,
                    role,
                };
                const token = (0, jwt_1.generateToken)(payload);
                const decoded = (0, jwt_1.verifyToken)(token);
                expect(decoded.userId).toBe(payload.userId);
                expect(decoded.email).toBe(payload.email);
                expect(decoded.role).toBe(payload.role);
            });
        });
    });
});
//# sourceMappingURL=jwt.test.js.map