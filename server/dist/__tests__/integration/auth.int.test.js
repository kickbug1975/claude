"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../../index"));
const database_1 = require("../../config/database");
describe('Auth Integration Tests', () => {
    const testUser = {
        email: 'test@example.com',
        password: 'Password123!',
        role: 'MONTEUR',
    };
    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            // S'assurer que l'utilisateur n'existe pas
            await database_1.prisma.user.deleteMany({ where: { email: testUser.email } });
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send(testUser);
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data).toHaveProperty('refreshToken');
            // Vérifier en base de données
            const userInDb = await database_1.prisma.user.findUnique({
                where: { email: testUser.email },
            });
            expect(userInDb).toBeTruthy();
            expect(userInDb?.role).toBe('MONTEUR');
        });
        it('should return 409 if email already exists', async () => {
            // Créer un utilisateur d'abord
            await (0, supertest_1.default)(index_1.default).post('/api/auth/register').send(testUser);
            // Retenter avec le même email
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send(testUser);
            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('déjà utilisé');
        });
    });
    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await database_1.prisma.user.deleteMany({ where: { email: testUser.email } });
            await (0, supertest_1.default)(index_1.default).post('/api/auth/register').send(testUser);
        });
        it('should login successfully with correct credentials', async () => {
            const response = await (0, supertest_1.default)(index_1.default).post('/api/auth/login').send({
                email: testUser.email,
                password: testUser.password,
            });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data).toHaveProperty('refreshToken');
        });
        it('should return 401 with incorrect password', async () => {
            const response = await (0, supertest_1.default)(index_1.default).post('/api/auth/login').send({
                email: testUser.email,
                password: 'wrongpassword',
            });
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });
    describe('GET /api/auth/me', () => {
        let token;
        beforeEach(async () => {
            await database_1.prisma.user.deleteMany({ where: { email: testUser.email } });
            const registerRes = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send(testUser);
            token = registerRes.body.data.token;
        });
        it('should return user info with valid token', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe(testUser.email);
        });
        it('should return 401 without token', async () => {
            const response = await (0, supertest_1.default)(index_1.default).get('/api/auth/me');
            expect(response.status).toBe(401);
        });
    });
    describe('POST /api/auth/refresh', () => {
        let refreshToken;
        beforeEach(async () => {
            await database_1.prisma.user.deleteMany({ where: { email: testUser.email } });
            const registerRes = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send(testUser);
            refreshToken = registerRes.body.data.refreshToken;
        });
        it('should return new tokens with valid refresh token', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/refresh')
                .send({ refreshToken });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data).toHaveProperty('refreshToken');
            // Vérifier que l'ancien token est révoqué (dans la logique du refresh)
            const oldTokenInDb = await database_1.prisma.refreshToken.findUnique({
                where: { token: refreshToken }
            });
            // Selon l'implémentation, il peut être supprimé ou marqué comme révoqué
            expect(oldTokenInDb).toBeNull();
        });
    });
});
//# sourceMappingURL=auth.int.test.js.map