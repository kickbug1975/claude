"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../middlewares/auth");
const jwt_1 = require("../../utils/jwt");
describe('Auth Middleware', () => {
    let mockRequest;
    let mockResponse;
    let nextFunction;
    beforeEach(() => {
        mockRequest = {
            headers: {},
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        nextFunction = jest.fn();
    });
    describe('authenticate', () => {
        it('should return 401 if no authorization header', () => {
            (0, auth_1.authenticate)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Token manquant ou invalide',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should return 401 if authorization header does not start with Bearer', () => {
            mockRequest.headers = { authorization: 'Basic token123' };
            (0, auth_1.authenticate)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Token manquant ou invalide',
            });
        });
        it('should return 401 for invalid token', () => {
            mockRequest.headers = { authorization: 'Bearer invalid-token' };
            (0, auth_1.authenticate)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Token invalide ou expiré',
            });
        });
        it('should call next() and set req.user for valid token', () => {
            const token = (0, jwt_1.generateToken)({
                userId: 'user-123',
                email: 'test@example.com',
                role: 'ADMIN',
            });
            mockRequest.headers = { authorization: `Bearer ${token}` };
            (0, auth_1.authenticate)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
            expect(mockRequest.user).toBeDefined();
            expect(mockRequest.user?.userId).toBe('user-123');
            expect(mockRequest.user?.email).toBe('test@example.com');
            expect(mockRequest.user?.role).toBe('ADMIN');
        });
    });
    describe('authorize', () => {
        it('should return 401 if user is not authenticated', () => {
            const authorizeMiddleware = (0, auth_1.authorize)('ADMIN');
            authorizeMiddleware(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Non authentifié',
            });
        });
        it('should return 403 if user role is not authorized', () => {
            mockRequest.user = {
                userId: 'user-123',
                email: 'test@example.com',
                role: 'MONTEUR',
            };
            const authorizeMiddleware = (0, auth_1.authorize)('ADMIN', 'SUPERVISEUR');
            authorizeMiddleware(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Accès non autorisé pour ce rôle',
            });
        });
        it('should call next() if user role is authorized', () => {
            mockRequest.user = {
                userId: 'user-123',
                email: 'admin@example.com',
                role: 'ADMIN',
            };
            const authorizeMiddleware = (0, auth_1.authorize)('ADMIN', 'SUPERVISEUR');
            authorizeMiddleware(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
        });
        it('should accept multiple roles', () => {
            const roles = ['ADMIN', 'SUPERVISEUR', 'MONTEUR'];
            roles.forEach((role) => {
                mockRequest.user = {
                    userId: 'user-123',
                    email: 'test@example.com',
                    role,
                };
                nextFunction = jest.fn();
                const authorizeMiddleware = (0, auth_1.authorize)('ADMIN', 'SUPERVISEUR', 'MONTEUR');
                authorizeMiddleware(mockRequest, mockResponse, nextFunction);
                expect(nextFunction).toHaveBeenCalled();
            });
        });
    });
});
//# sourceMappingURL=auth.test.js.map