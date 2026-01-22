"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../../index"));
const database_1 = require("../../config/database");
describe('Stats Integration Tests', () => {
    let adminToken;
    let monteurToken;
    let monteurId;
    let chantierId;
    async function getAuthToken(email, role) {
        const registerRes = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/register')
            .send({
            email,
            password: 'Password123!',
            role,
        });
        if (registerRes.body.data && registerRes.body.data.token) {
            return registerRes.body.data.token;
        }
        const loginRes = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/login')
            .send({
            email,
            password: 'Password123!',
        });
        return loginRes.body.data.token;
    }
    beforeAll(async () => {
        adminToken = await getAuthToken('admin@stats.com', 'ADMIN');
        monteurToken = await getAuthToken('user@stats.com', 'MONTEUR');
        // Créer un monteur AVEC un email unique (ou réutiliser si existe)
        const emailMonteur = 'stats@test.com';
        let m = await database_1.prisma.monteur.findUnique({ where: { email: emailMonteur } });
        if (!m) {
            m = await database_1.prisma.monteur.create({
                data: {
                    nom: 'Stats',
                    prenom: 'User',
                    email: emailMonteur,
                    telephone: '0000000000',
                    adresse: 'Test',
                    dateEmbauche: new Date(),
                    numeroIdentification: 'STATS-ID-' + Math.random()
                }
            });
        }
        monteurId = m.id;
        // Lier le monteur au user créé par register
        await database_1.prisma.user.update({
            where: { email: 'user@stats.com' },
            data: { monteurId: m.id }
        });
        // Créer un chantier
        const c = await database_1.prisma.chantier.create({
            data: {
                nom: 'Chantier Stats',
                adresse: 'Test',
                client: 'Test',
                reference: 'REF-STATS-' + Math.random(),
                dateDebut: new Date(),
                description: 'Test'
            }
        });
        chantierId = c.id;
        // Créer quelques feuilles de travail validées pour le mois en cours
        await database_1.prisma.feuilleTravail.createMany({
            data: [
                {
                    monteurId,
                    chantierId: c.id,
                    dateTravail: new Date(),
                    heureDebut: '08:00',
                    heureFin: '12:00',
                    heuresTotales: 4,
                    descriptionTravail: 'Matin',
                    statut: 'VALIDE'
                },
                {
                    monteurId,
                    chantierId: c.id,
                    dateTravail: new Date(),
                    heureDebut: '13:00',
                    heureFin: '17:00',
                    heuresTotales: 4,
                    descriptionTravail: 'Après-midi',
                    statut: 'VALIDE'
                }
            ]
        });
    });
    describe('GET /api/monteurs/:id/stats', () => {
        it('should return monteur stats for admin', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get(`/api/monteurs/${monteurId}/stats`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('heuresTotal');
            expect(response.body.data.heuresTotal).toBe(8);
        });
        it('should return 200 with zeros for non-existent monteur stats (as per implementation)', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/monteurs/ffffffff-ffff-ffff-ffff-ffffffffffff/stats')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.data.heuresTotal).toBe(0);
        });
    });
    describe('GET /api/chantiers/:id/stats', () => {
        it('should return chantier stats', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get(`/api/chantiers/${chantierId}/stats`)
                .set('Authorization', `Bearer ${monteurToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('heuresTotal');
            expect(response.body.data.heuresTotal).toBe(8);
        });
    });
});
//# sourceMappingURL=stats.int.test.js.map