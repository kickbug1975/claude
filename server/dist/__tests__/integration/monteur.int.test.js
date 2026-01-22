"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../../index"));
const database_1 = require("../../config/database");
describe('Monteur Integration Tests', () => {
    let adminToken;
    let monteurToken;
    const validMonteurData = {
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@test.com',
        telephone: '0102030405',
        adresse: '123 Rue de la Paix, Paris',
        dateEmbauche: new Date().toISOString(),
        numeroIdentification: 'MONTEUR-001'
    };
    beforeAll(async () => {
        // Créer un admin
        const adminRes = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/register')
            .send({
            email: 'admin@monteur.com',
            password: 'Password123!',
            role: 'ADMIN',
        });
        adminToken = adminRes.body.data.token;
        // Créer un monteur simple
        const monteurRes = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/register')
            .send({
            email: 'user@monteur.com',
            password: 'Password123!',
            role: 'MONTEUR',
        });
        monteurToken = monteurRes.body.data.token;
    });
    describe('POST /api/monteurs', () => {
        it('should create a monteur if user is admin', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/monteurs')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validMonteurData);
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.nom).toBe(validMonteurData.nom);
        });
        it('should return 403 if user is not admin', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/monteurs')
                .set('Authorization', `Bearer ${monteurToken}`)
                .send({ ...validMonteurData, email: 'other@test.com', numeroIdentification: 'M002' });
            expect(response.status).toBe(403);
        });
    });
    describe('GET /api/monteurs', () => {
        it('should return list of monteurs', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/monteurs')
                .set('Authorization', `Bearer ${monteurToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });
    describe('GET /api/monteurs/:id', () => {
        let monteurId;
        beforeEach(async () => {
            const m = await database_1.prisma.monteur.create({
                data: {
                    nom: 'Test',
                    prenom: 'User',
                    email: 'test.user@ext.com',
                    telephone: '0000000000',
                    adresse: 'Test adresse',
                    dateEmbauche: new Date(),
                    numeroIdentification: 'TEST-ID-' + Math.random()
                }
            });
            monteurId = m.id;
        });
        it('should return monteur details', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get(`/api/monteurs/${monteurId}`)
                .set('Authorization', `Bearer ${monteurToken}`);
            expect(response.status).toBe(200);
            expect(response.body.data.nom).toBe('Test');
        });
    });
    describe('PUT /api/monteurs/:id', () => {
        let monteurId;
        beforeEach(async () => {
            const m = await database_1.prisma.monteur.create({
                data: {
                    nom: 'Old',
                    prenom: 'Name',
                    email: 'old@test.com',
                    telephone: '0000000000',
                    adresse: 'Old adresse',
                    dateEmbauche: new Date(),
                    numeroIdentification: 'OLD-ID'
                }
            });
            monteurId = m.id;
        });
        it('should update monteur if admin', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .put(`/api/monteurs/${monteurId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ nom: 'New' });
            expect(response.status).toBe(200);
            expect(response.body.data.nom).toBe('New');
        });
    });
});
//# sourceMappingURL=monteur.int.test.js.map