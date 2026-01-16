import { Request, Response } from 'express'
import {
    getAllFeuilles,
    getFeuilleById,
    createFeuille,
    updateFeuille,
    submitFeuille,
    validateFeuille,
    rejectFeuille,
    addFrais,
    deleteFrais,
} from '../../controllers/feuilleController'
import { prisma } from '../../config/database'
import { emailService } from '../../services/emailService'

// Mock emailService
jest.mock('../../services/emailService', () => ({
    emailService: {
        notifySubmission: jest.fn(),
        notifyValidation: jest.fn(),
        notifyRejection: jest.fn(),
    },
}))

describe('Feuille Controller', () => {
    let mockRequest: Partial<Request>
    let mockResponse: Partial<Response>

    beforeEach(() => {
        mockRequest = {
            body: {},
            params: {},
            query: {},
            user: { userId: 'user-1', email: 'admin@test.com', role: 'ADMIN' },
        }
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        }
        jest.clearAllMocks()
    })

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
            ]

                ; (prisma.feuilleTravail.count as jest.Mock) = jest.fn().mockResolvedValue(1)
                ; (prisma.feuilleTravail.findMany as jest.Mock) = jest.fn().mockResolvedValue(mockFeuilles)

            mockRequest.query = { page: '1', limit: '10' }

            await getAllFeuilles(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockFeuilles,
                })
            )
        })

        it('should filter by monteur for MONTEUR role', async () => {
            mockRequest.user = { userId: 'user-monteur', email: 'monteur@test.com', role: 'MONTEUR' }
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ monteurId: 'monteur-1' })
                ; (prisma.feuilleTravail.count as jest.Mock) = jest.fn().mockResolvedValue(0)
                ; (prisma.feuilleTravail.findMany as jest.Mock) = jest.fn().mockResolvedValue([])

            await getAllFeuilles(mockRequest as Request, mockResponse as Response)

            expect(prisma.feuilleTravail.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ monteurId: 'monteur-1' }),
                })
            )
        })
    })

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
            }

                ; (prisma.feuilleTravail.findUnique as jest.Mock).mockResolvedValue(mockFeuille)

            mockRequest.params = { id: 'feuille-1' }

            await getFeuilleById(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockFeuille,
            })
        })

        it('should return 404 when not found', async () => {
            ; (prisma.feuilleTravail.findUnique as jest.Mock).mockResolvedValue(null)

            mockRequest.params = { id: 'nonexistent' }

            await getFeuilleById(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(404)
        })
    })

    describe('createFeuille', () => {
        const validFeuilleData = {
            monteurId: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID
            chantierId: '550e8400-e29b-41d4-a716-446655440002', // Valid UUID
            dateTravail: '2024-01-15',
            heureDebut: '08:00',
            heureFin: '17:00',
            descriptionTravail: 'Installation',
            frais: [{ typeFrais: 'REPAS', montant: 15, description: 'Déjeuner' }],
        }

        it('should create feuille with valid data', async () => {
            ; (prisma.monteur.findUnique as jest.Mock).mockResolvedValue({ id: validFeuilleData.monteurId })
                ; (prisma.chantier.findUnique as jest.Mock).mockResolvedValue({ id: validFeuilleData.chantierId })
                ; (prisma.feuilleTravail.create as jest.Mock).mockResolvedValue({
                    id: 'feuille-1',
                    ...validFeuilleData,
                    heuresTotales: 9,
                    statut: 'BROUILLON',
                })

            mockRequest.body = validFeuilleData

            await createFeuille(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(201)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Feuille de travail créée avec succès',
                })
            )
        })

        it('should return 400 for invalid time range', async () => {
            const invalidTimeData = {
                ...validFeuilleData,
                heureDebut: '17:00',
                heureFin: '08:00',
            }

                ; (prisma.monteur.findUnique as jest.Mock).mockResolvedValue({ id: validFeuilleData.monteurId })
                ; (prisma.chantier.findUnique as jest.Mock).mockResolvedValue({ id: validFeuilleData.chantierId })

            mockRequest.body = invalidTimeData

            await createFeuille(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(400)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "L'heure de fin doit être après l'heure de début",
                })
            )
        })

        it('should return 404 if monteur not found', async () => {
            ; (prisma.monteur.findUnique as jest.Mock).mockResolvedValue(null)

            mockRequest.body = validFeuilleData

            await createFeuille(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(404)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Monteur non trouvé',
                })
            )
        })
    })

    describe('updateFeuille', () => {
        it('should update feuille successfully', async () => {
            ; (prisma.feuilleTravail.findUnique as jest.Mock).mockResolvedValue({
                id: 'feuille-1',
                statut: 'BROUILLON',
                heureDebut: '08:00',
                heureFin: '17:00',
                heuresTotales: 9,
            })
                ; (prisma.feuilleTravail.update as jest.Mock).mockResolvedValue({
                    id: 'feuille-1',
                    descriptionTravail: 'Updated',
                })

            mockRequest.params = { id: 'feuille-1' }
            mockRequest.body = { descriptionTravail: 'Updated' }

            await updateFeuille(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
        })

        it('should prevent updating validated feuille', async () => {
            ; (prisma.feuilleTravail.findFirst as jest.Mock).mockResolvedValue({
                id: 'feuille-1',
                statut: 'VALIDE',
            })

            mockRequest.params = { id: 'feuille-1' }
            mockRequest.body = { descriptionTravail: 'Updated' }

            await updateFeuille(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(403)
        })
    })

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
            }

                ; (prisma.feuilleTravail.findUnique as jest.Mock).mockResolvedValue(mockFeuille)
                ; (prisma.feuilleTravail.update as jest.Mock).mockResolvedValue({
                    ...mockFeuille,
                    statut: 'SOUMIS',
                })
                ; (prisma.user.findMany as jest.Mock).mockResolvedValue([{ email: 'admin@test.com' }])

            mockRequest.params = { id: 'feuille-1' }

            await submitFeuille(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(emailService.notifySubmission).toHaveBeenCalled()
        })

        it('should reject if not in BROUILLON status', async () => {
            ; (prisma.feuilleTravail.findUnique as jest.Mock).mockResolvedValue({
                id: 'feuille-1',
                statut: 'SOUMIS',
            })

            mockRequest.params = { id: 'feuille-1' }

            await submitFeuille(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(400)
        })
    })

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
            }

                ; (prisma.feuilleTravail.findUnique as jest.Mock).mockResolvedValue(mockFeuille)
                ; (prisma.feuilleTravail.update as jest.Mock).mockResolvedValue({
                    ...mockFeuille,
                    statut: 'VALIDE',
                })
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: 'admin@test.com' })

            mockRequest.params = { id: 'feuille-1' }

            await validateFeuille(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(emailService.notifyValidation).toHaveBeenCalled()
        })

        it('should reject if not in SOUMIS status', async () => {
            ; (prisma.feuilleTravail.findUnique as jest.Mock).mockResolvedValue({
                id: 'feuille-1',
                statut: 'BROUILLON',
            })

            mockRequest.params = { id: 'feuille-1' }

            await validateFeuille(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(400)
        })
    })

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
            }

                ; (prisma.feuilleTravail.findUnique as jest.Mock).mockResolvedValue(mockFeuille)
                ; (prisma.feuilleTravail.update as jest.Mock).mockResolvedValue({
                    ...mockFeuille,
                    statut: 'REJETE',
                })
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: 'admin@test.com' })

            mockRequest.params = { id: 'feuille-1' }
            mockRequest.body = { motif: 'Informations incomplètes' }

            await rejectFeuille(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(emailService.notifyRejection).toHaveBeenCalled()
        })
    })

    describe('addFrais', () => {
        it('should add frais to feuille', async () => {
            ; (prisma.feuilleTravail.findUnique as jest.Mock).mockResolvedValue({
                id: 'feuille-1',
                statut: 'BROUILLON',
            })
                ; (prisma.frais.create as jest.Mock).mockResolvedValue({
                    id: 'frais-1',
                    typeFrais: 'REPAS',
                    montant: 15,
                    description: 'Déjeuner',
                })

            mockRequest.params = { id: 'feuille-1' }
            mockRequest.body = {
                typeFrais: 'REPAS',
                montant: 15,
                description: 'Déjeuner',
            }

            await addFrais(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(201)
        })

        it('should prevent adding frais to validated feuille', async () => {
            ; (prisma.feuilleTravail.findUnique as jest.Mock).mockResolvedValue({
                id: 'feuille-1',
                statut: 'VALIDE',
            })

            mockRequest.params = { id: 'feuille-1' }
            mockRequest.body = {
                typeFrais: 'REPAS',
                montant: 15,
                description: 'Déjeuner',
            }

            await addFrais(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(403)
        })
    })

    describe('deleteFrais', () => {
        it('should delete frais successfully', async () => {
            ; (prisma.frais.findUnique as jest.Mock).mockResolvedValue({
                id: 'frais-1',
                feuille: { statut: 'BROUILLON' },
            })
                ; (prisma.frais.delete as jest.Mock).mockResolvedValue({ id: 'frais-1' })

            mockRequest.params = { fraisId: 'frais-1' }

            await deleteFrais(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
        })

        it('should prevent deleting frais from validated feuille', async () => {
            ; (prisma.frais.findUnique as jest.Mock).mockResolvedValue({
                id: 'frais-1',
                feuille: { statut: 'VALIDE' },
            })

            mockRequest.params = { fraisId: 'frais-1' }

            await deleteFrais(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(403)
        })
    })
})
