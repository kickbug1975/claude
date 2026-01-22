"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const authController_1 = require("../../controllers/authController");
const database_1 = require("../../config/database");
// Mock bcrypt
jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}));
describe('Auth Controller', () => {
    let mockRequest;
    let mockResponse;
    beforeEach(() => {
        mockRequest = {
            body: {},
            user: undefined,
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });
    describe('login', () => {
        it('should return 400 for invalid email format', async () => {
            mockRequest.body = { email: 'invalid-email', password: 'password123' };
            await (0, authController_1.login)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Données invalides',
            }));
        });
        it('should return 400 for missing password', async () => {
            mockRequest.body = { email: 'test@example.com', password: '' };
            await (0, authController_1.login)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Données invalides',
            }));
        });
        it('should return 401 for non-existent user', async () => {
            mockRequest.body = { email: 'notfound@example.com', password: 'password123' };
            database_1.prisma.user.findUnique.mockResolvedValue(null);
            await (0, authController_1.login)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Email ou mot de passe incorrect',
            });
        });
        it('should return 401 for incorrect password', async () => {
            mockRequest.body = { email: 'test@example.com', password: 'wrongpassword' };
            database_1.prisma.user.findUnique.mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com',
                password: 'hashed-password',
                role: 'ADMIN',
            });
            bcryptjs_1.default.compare.mockResolvedValue(false);
            await (0, authController_1.login)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Email ou mot de passe incorrect',
            });
        });
        it('should return 200 with token for valid credentials', async () => {
            mockRequest.body = { email: 'admin@example.com', password: 'Admin123!' };
            const mockUser = {
                id: 'user-123',
                email: 'admin@example.com',
                password: 'hashed-password',
                role: 'ADMIN',
                monteurId: null,
                monteur: null,
            };
            database_1.prisma.user.findUnique.mockResolvedValue(mockUser);
            bcryptjs_1.default.compare.mockResolvedValue(true);
            await (0, authController_1.login)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Connexion réussie',
                data: expect.objectContaining({
                    user: expect.objectContaining({
                        id: 'user-123',
                        email: 'admin@example.com',
                        role: 'ADMIN',
                    }),
                    token: expect.any(String),
                }),
            }));
        });
    });
    describe('register', () => {
        it('should return 400 for invalid email', async () => {
            mockRequest.body = { email: 'invalid', password: 'Password123!' };
            await (0, authController_1.register)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Données invalides',
            }));
        });
        it('should return 400 for password too short', async () => {
            mockRequest.body = { email: 'test@example.com', password: '123' };
            await (0, authController_1.register)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Données invalides',
            }));
        });
        it('should return 409 if email already exists', async () => {
            mockRequest.body = { email: 'existing@example.com', password: 'Password123!' };
            database_1.prisma.user.findUnique.mockResolvedValue({
                id: 'existing-user',
                email: 'existing@example.com',
            });
            await (0, authController_1.register)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Cet email est déjà utilisé',
            });
        });
        it('should return 201 for successful registration', async () => {
            mockRequest.body = { email: 'new@example.com', password: 'Password123!' };
            database_1.prisma.user.findUnique.mockResolvedValue(null);
            bcryptjs_1.default.hash.mockResolvedValue('hashed-password');
            database_1.prisma.user.create.mockResolvedValue({
                id: 'new-user-123',
                email: 'new@example.com',
                role: 'MONTEUR',
            });
            await (0, authController_1.register)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Inscription réussie',
                data: expect.objectContaining({
                    user: expect.objectContaining({
                        email: 'new@example.com',
                        role: 'MONTEUR',
                    }),
                    token: expect.any(String),
                }),
            }));
        });
        it('should accept custom role during registration', async () => {
            mockRequest.body = {
                email: 'supervisor@example.com',
                password: 'Password123!',
                role: 'SUPERVISEUR',
            };
            database_1.prisma.user.findUnique.mockResolvedValue(null);
            bcryptjs_1.default.hash.mockResolvedValue('hashed-password');
            database_1.prisma.user.create.mockResolvedValue({
                id: 'new-user-456',
                email: 'supervisor@example.com',
                role: 'SUPERVISEUR',
            });
            await (0, authController_1.register)(mockRequest, mockResponse);
            expect(database_1.prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    role: 'SUPERVISEUR',
                }),
            }));
        });
    });
    describe('me', () => {
        it('should return 401 if user is not authenticated', async () => {
            mockRequest.user = undefined;
            await (0, authController_1.me)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Non authentifié',
            });
        });
        it('should return 404 if user not found in database', async () => {
            mockRequest.user = {
                userId: 'nonexistent-user',
                email: 'test@example.com',
                role: 'ADMIN',
            };
            database_1.prisma.user.findUnique.mockResolvedValue(null);
            await (0, authController_1.me)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Utilisateur non trouvé',
            });
        });
        it('should return 200 with user data for authenticated user', async () => {
            mockRequest.user = {
                userId: 'user-123',
                email: 'admin@example.com',
                role: 'ADMIN',
            };
            const mockUser = {
                id: 'user-123',
                email: 'admin@example.com',
                role: 'ADMIN',
                monteurId: null,
                monteur: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            database_1.prisma.user.findUnique.mockResolvedValue(mockUser);
            await (0, authController_1.me)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    id: 'user-123',
                    email: 'admin@example.com',
                    role: 'ADMIN',
                }),
            }));
        });
    });
});
//# sourceMappingURL=authController.test.js.map