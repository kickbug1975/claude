"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const feuilleController_1 = require("../../controllers/feuilleController");
const database_1 = require("../../config/database");
const emailService_1 = require("../../services/emailService");
// Mock emailService
jest.mock('../../services/emailService', () => ({
    emailService: {
        notifySubmission: jest.fn(),
        notifyValidation: jest.fn(),
        notifyRejection: jest.fn(),
    },
}));
describe('Feuille Controller', () => {
    let mockRequest;
    let mockResponse;
    beforeEach(() => {
        mockRequest = {
            body: {},
            params: {},
            query: {},
            user: { userId: 'user-1', email: 'admin@test.com', role: 'ADMIN' },
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });
    describe('getAllFeuilles', () => {
        it('should return paginated list for admin', async () => {
            const mockFeuilles = [
                {
                    id: 'feuille-1',
                    monteurId: 'monteur-1',
                    chantierId: 'chantier-1',
                    dateTravail: new Date(),
                    heureDebut: '08:00',
                    heureFin: '17:00',
                    heuresTotales: 8.5,
                    descriptionTravail: 'Test',
                    statut: 'BROUILLON',
                    monteur: { nom: 'Dupont', prenom: 'Jean', numeroIdentification: 'M001' },
                    chantier: { nom: 'Chantier 1', reference: 'REF-001' },
                    frais: [],
                    validePar: null,
                },
            ];
            database_1.prisma.feuilleTravail.count = jest.fn().mockResolvedValue(1);
            database_1.prisma.feuilleTravail.findMany = jest.fn().mockResolvedValue(mockFeuilles);
            mockRequest.query = { page: '1', limit: '10' };
            await (0, feuilleController_1.getAllFeuilles)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockFeuilles,
            }));
        });
        it('should filter by monteur for MONTEUR role', async () => {
            mockRequest.user = { userId: 'user-monteur', email: 'monteur@test.com', role: 'MONTEUR' };
            database_1.prisma.user.findUnique.mockResolvedValue({ monteurId: 'monteur-1' });
            database_1.prisma.feuilleTravail.count = jest.fn().mockResolvedValue(0);
            database_1.prisma.feuilleTravail.findMany = jest.fn().mockResolvedValue([]);
            await (0, feuilleController_1.getAllFeuilles)(mockRequest, mockResponse);
            expect(database_1.prisma.feuilleTravail.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ monteurId: 'monteur-1' }),
            }));
        });
    });
    describe('getFeuilleById', () => {
        it('should return feuille when found', async () => {
            const mockFeuille = {
                id: 'feuille-1',
                monteurId: 'monteur-1',
                chantierId: 'chantier-1',
                dateTravail: new Date(),
                heureDebut: '08:00',
                heureFin: '17:00',
                heuresTotales: 8.5,
                descriptionTravail: 'Test',
                statut: 'BROUILLON',
                monteur: {},
                chantier: {},
                frais: [],
                validePar: null,
            };
            database_1.prisma.feuilleTravail.findUnique.mockResolvedValue(mockFeuille);
            mockRequest.params = { id: 'feuille-1' };
            await (0, feuilleController_1.getFeuilleById)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockFeuille,
            });
        });
        it('should return 404 when not found', async () => {
            ;
            database_1.prisma.feuilleTravail.findUnique.mockResolvedValue(null);
            mockRequest.params = { id: 'nonexistent' };
            await (0, feuilleController_1.getFeuilleById)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });
    });
    describe('createFeuille', () => {
        const validFeuilleData = {
            monteurId: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID
            chantierId: '550e8400-e29b-41d4-a716-446655440002', // Valid UUID
            dateTravail: '2024-01-15',
            heureDebut: '08:00',
            heureFin: '17:00',
            descriptionTravail: 'Installation',
            frais: [{ typeFrais: 'REPAS', montant: 15, description: 'Déjeuner' }],
        };
        it('should create feuille with valid data', async () => {
            ;
            database_1.prisma.monteur.findUnique.mockResolvedValue({ id: validFeuilleData.monteurId });
            database_1.prisma.chantier.findUnique.mockResolvedValue({ id: validFeuilleData.chantierId });
            database_1.prisma.feuilleTravail.create.mockResolvedValue({
                id: 'feuille-1',
                ...validFeuilleData,
                heuresTotales: 9,
                statut: 'BROUILLON',
            });
            mockRequest.body = validFeuilleData;
            await (0, feuilleController_1.createFeuille)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Feuille de travail créée avec succès',
            }));
        });
        it('should return 400 for invalid time range', async () => {
            const invalidTimeData = {
                ...validFeuilleData,
                heureDebut: '17:00',
                heureFin: '08:00',
            };
            database_1.prisma.monteur.findUnique.mockResolvedValue({ id: validFeuilleData.monteurId });
            database_1.prisma.chantier.findUnique.mockResolvedValue({ id: validFeuilleData.chantierId });
            mockRequest.body = invalidTimeData;
            await (0, feuilleController_1.createFeuille)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "L'heure de fin doit être après l'heure de début",
            }));
        });
        it('should return 404 if monteur not found', async () => {
            ;
            database_1.prisma.monteur.findUnique.mockResolvedValue(null);
            mockRequest.body = validFeuilleData;
            await (0, feuilleController_1.createFeuille)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Monteur non trouvé',
            }));
        });
    });
    describe('updateFeuille', () => {
        it('should update feuille successfully', async () => {
            ;
            database_1.prisma.feuilleTravail.findUnique.mockResolvedValue({
                id: 'feuille-1',
                statut: 'BROUILLON',
                heureDebut: '08:00',
                heureFin: '17:00',
                heuresTotales: 9,
            });
            database_1.prisma.feuilleTravail.update.mockResolvedValue({
                id: 'feuille-1',
                descriptionTravail: 'Updated',
            });
            mockRequest.params = { id: 'feuille-1' };
            mockRequest.body = { descriptionTravail: 'Updated' };
            await (0, feuilleController_1.updateFeuille)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
        it('should prevent updating validated feuille', async () => {
            ;
            database_1.prisma.feuilleTravail.findFirst.mockResolvedValue({
                id: 'feuille-1',
                statut: 'VALIDE',
            });
            mockRequest.params = { id: 'feuille-1' };
            mockRequest.body = { descriptionTravail: 'Updated' };
            await (0, feuilleController_1.updateFeuille)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
        });
    });
    describe('submitFeuille', () => {
        it('should submit feuille and send notifications', async () => {
            const mockFeuille = {
                id: 'feuille-1',
                statut: 'BROUILLON',
                monteur: { nom: 'Dupont', prenom: 'Jean', email: 'jean@test.com' },
                chantier: { nom: 'Chantier 1', reference: 'REF-001' },
                frais: [{ montant: 15 }],
                dateTravail: new Date(),
                heureDebut: '08:00',
                heureFin: '17:00',
                heuresTotales: 9,
                descriptionTravail: 'Test',
            };
            database_1.prisma.feuilleTravail.findUnique.mockResolvedValue(mockFeuille);
            database_1.prisma.feuilleTravail.update.mockResolvedValue({
                ...mockFeuille,
                statut: 'SOUMIS',
            });
            database_1.prisma.user.findMany.mockResolvedValue([{ email: 'admin@test.com' }]);
            mockRequest.params = { id: 'feuille-1' };
            await (0, feuilleController_1.submitFeuille)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(emailService_1.emailService.notifySubmission).toHaveBeenCalled();
        });
        it('should reject if not in BROUILLON status', async () => {
            ;
            database_1.prisma.feuilleTravail.findUnique.mockResolvedValue({
                id: 'feuille-1',
                statut: 'SOUMIS',
            });
            mockRequest.params = { id: 'feuille-1' };
            await (0, feuilleController_1.submitFeuille)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });
    });
    describe('validateFeuille', () => {
        it('should validate feuille successfully', async () => {
            const mockFeuille = {
                id: 'feuille-1',
                statut: 'SOUMIS',
                monteur: { nom: 'Dupont', prenom: 'Jean', email: 'jean@test.com' },
                chantier: { nom: 'Chantier 1', reference: 'REF-001' },
                dateTravail: new Date(),
                heureDebut: '08:00',
                heureFin: '17:00',
                heuresTotales: 9,
                descriptionTravail: 'Test',
            };
            database_1.prisma.feuilleTravail.findUnique.mockResolvedValue(mockFeuille);
            database_1.prisma.feuilleTravail.update.mockResolvedValue({
                ...mockFeuille,
                statut: 'VALIDE',
            });
            database_1.prisma.user.findUnique.mockResolvedValue({ email: 'admin@test.com' });
            mockRequest.params = { id: 'feuille-1' };
            await (0, feuilleController_1.validateFeuille)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(emailService_1.emailService.notifyValidation).toHaveBeenCalled();
        });
        it('should reject if not in SOUMIS status', async () => {
            ;
            database_1.prisma.feuilleTravail.findUnique.mockResolvedValue({
                id: 'feuille-1',
                statut: 'BROUILLON',
            });
            mockRequest.params = { id: 'feuille-1' };
            await (0, feuilleController_1.validateFeuille)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });
    });
    describe('rejectFeuille', () => {
        it('should reject feuille successfully', async () => {
            const mockFeuille = {
                id: 'feuille-1',
                statut: 'SOUMIS',
                monteur: { nom: 'Dupont', prenom: 'Jean', email: 'jean@test.com' },
                chantier: { nom: 'Chantier 1', reference: 'REF-001' },
                dateTravail: new Date(),
                heureDebut: '08:00',
                heureFin: '17:00',
                heuresTotales: 9,
                descriptionTravail: 'Test',
            };
            database_1.prisma.feuilleTravail.findUnique.mockResolvedValue(mockFeuille);
            database_1.prisma.feuilleTravail.update.mockResolvedValue({
                ...mockFeuille,
                statut: 'REJETE',
            });
            database_1.prisma.user.findUnique.mockResolvedValue({ email: 'admin@test.com' });
            mockRequest.params = { id: 'feuille-1' };
            mockRequest.body = { motif: 'Informations incomplètes' };
            await (0, feuilleController_1.rejectFeuille)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(emailService_1.emailService.notifyRejection).toHaveBeenCalled();
        });
    });
    describe('addFrais', () => {
        it('should add frais to feuille', async () => {
            ;
            database_1.prisma.feuilleTravail.findUnique.mockResolvedValue({
                id: 'feuille-1',
                statut: 'BROUILLON',
            });
            database_1.prisma.frais.create.mockResolvedValue({
                id: 'frais-1',
                typeFrais: 'REPAS',
                montant: 15,
                description: 'Déjeuner',
            });
            mockRequest.params = { id: 'feuille-1' };
            mockRequest.body = {
                typeFrais: 'REPAS',
                montant: 15,
                description: 'Déjeuner',
            };
            await (0, feuilleController_1.addFrais)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });
        it('should prevent adding frais to validated feuille', async () => {
            ;
            database_1.prisma.feuilleTravail.findUnique.mockResolvedValue({
                id: 'feuille-1',
                statut: 'VALIDE',
            });
            mockRequest.params = { id: 'feuille-1' };
            mockRequest.body = {
                typeFrais: 'REPAS',
                montant: 15,
                description: 'Déjeuner',
            };
            await (0, feuilleController_1.addFrais)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
        });
    });
    describe('deleteFrais', () => {
        it('should delete frais successfully', async () => {
            ;
            database_1.prisma.frais.findUnique.mockResolvedValue({
                id: 'frais-1',
                feuille: { statut: 'BROUILLON' },
            });
            database_1.prisma.frais.delete.mockResolvedValue({ id: 'frais-1' });
            mockRequest.params = { fraisId: 'frais-1' };
            await (0, feuilleController_1.deleteFrais)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
        it('should prevent deleting frais from validated feuille', async () => {
            ;
            database_1.prisma.frais.findUnique.mockResolvedValue({
                id: 'frais-1',
                feuille: { statut: 'VALIDE' },
            });
            mockRequest.params = { fraisId: 'frais-1' };
            await (0, feuilleController_1.deleteFrais)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
        });
    });
});
//# sourceMappingURL=feuilleController.test.js.map