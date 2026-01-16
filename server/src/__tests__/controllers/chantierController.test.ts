import { Request, Response } from 'express'
import {
    getAllChantiers,
    getChantierById,
    createChantier,
    updateChantier,
    deleteChantier,
    getChantierStats,
} from '../../controllers/chantierController'
import { prisma } from '../../config/database'

describe('Chantier Controller', () => {
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

    describe('getAllChantiers', () => {
        it('should return paginated list of chantiers', async () => {
            const mockChantiers = [
                {
                    id: 'chantier-1',
                    nom: 'Chantier Test',
                    adresse: '123 Rue Test',
                    client: 'Client Test',
                    reference: 'REF-001',
                    dateDebut: new Date('2024-01-01'),
                    dateFin: null,
                    description: 'Description test',
                    actif: true,
                },
            ]

                ; (prisma.chantier.count as jest.Mock).mockResolvedValue(1)
                ; (prisma.chantier.findMany as jest.Mock).mockResolvedValue(mockChantiers)

            mockRequest.query = { page: '1', limit: '10' }

            await getAllChantiers(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockChantiers,
                    pagination: expect.objectContaining({
                        page: 1,
                        pageSize: 10,
                        total: 1,
                        totalPages: 1,
                    }),
                })
            )
        })

        it('should filter chantiers by actif status', async () => {
            ; (prisma.chantier.count as jest.Mock).mockResolvedValue(0)
                ; (prisma.chantier.findMany as jest.Mock).mockResolvedValue([])

            mockRequest.query = { actif: 'false' }

            await getAllChantiers(mockRequest as Request, mockResponse as Response)

            expect(prisma.chantier.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { actif: false },
                })
            )
        })

        it('should handle errors gracefully', async () => {
            ; (prisma.chantier.count as jest.Mock).mockRejectedValue(new Error('Database error'))

            await getAllChantiers(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Erreur serveur',
            })
        })
    })

    describe('getChantierById', () => {
        it('should return chantier when found', async () => {
            const mockChantier = {
                id: 'chantier-1',
                nom: 'Chantier Test',
                adresse: '123 Rue Test',
                client: 'Client Test',
                reference: 'REF-001',
                dateDebut: new Date('2024-01-01'),
                dateFin: null,
                description: 'Description test',
                actif: true,
                feuillesTravail: [],
            }

                ; (prisma.chantier.findUnique as jest.Mock).mockResolvedValue(mockChantier)

            mockRequest.params = { id: 'chantier-1' }

            await getChantierById(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockChantier,
            })
        })

        it('should return 404 when chantier not found', async () => {
            ; (prisma.chantier.findUnique as jest.Mock).mockResolvedValue(null)

            mockRequest.params = { id: 'nonexistent' }

            await getChantierById(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(404)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Chantier non trouvé',
            })
        })

        it('should handle errors gracefully', async () => {
            ; (prisma.chantier.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

            mockRequest.params = { id: 'chantier-1' }

            await getChantierById(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Erreur serveur',
            })
        })
    })

    describe('createChantier', () => {
        const validChantierData = {
            nom: 'Nouveau Chantier',
            adresse: '456 Avenue Test',
            client: 'Client ABC',
            reference: 'REF-002',
            dateDebut: '2024-02-01',
            description: 'Description du chantier',
            actif: true,
        }

        it('should create chantier with valid data', async () => {
            const mockCreatedChantier = {
                id: 'chantier-1',
                ...validChantierData,
                dateDebut: new Date('2024-02-01'),
                dateFin: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

                ; (prisma.chantier.findUnique as jest.Mock).mockResolvedValue(null)
                ; (prisma.chantier.create as jest.Mock).mockResolvedValue(mockCreatedChantier)

            mockRequest.body = validChantierData

            await createChantier(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(201)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Chantier créé avec succès',
                data: mockCreatedChantier,
            })
        })

        it('should return 400 for invalid data', async () => {
            mockRequest.body = {
                nom: '',
                reference: '',
            }

            await createChantier(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(400)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Données invalides',
                    errors: expect.any(Object),
                })
            )
        })

        it('should return 409 if reference already exists', async () => {
            ; (prisma.chantier.findUnique as jest.Mock).mockResolvedValue({
                id: 'existing-chantier',
                reference: validChantierData.reference,
            })

            mockRequest.body = validChantierData

            await createChantier(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(409)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Cette référence est déjà utilisée',
            })
        })

        it('should handle errors gracefully', async () => {
            ; (prisma.chantier.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

            mockRequest.body = validChantierData

            await createChantier(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Erreur serveur',
            })
        })
    })

    describe('updateChantier', () => {
        it('should update chantier with valid data', async () => {
            const mockUpdatedChantier = {
                id: 'chantier-1',
                nom: 'Chantier Updated',
                adresse: '123 Rue Test',
                client: 'Client Test',
                reference: 'REF-001',
                dateDebut: new Date('2024-01-01'),
                dateFin: null,
                description: 'Description test',
                actif: true,
            }

                ; (prisma.chantier.findUnique as jest.Mock).mockResolvedValue({ id: 'chantier-1' })
                ; (prisma.chantier.update as jest.Mock).mockResolvedValue(mockUpdatedChantier)

            mockRequest.params = { id: 'chantier-1' }
            mockRequest.body = { nom: 'Chantier Updated' }

            await updateChantier(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Chantier mis à jour avec succès',
                data: mockUpdatedChantier,
            })
        })

        it('should return 404 if chantier not found', async () => {
            ; (prisma.chantier.findUnique as jest.Mock).mockResolvedValue(null)

            mockRequest.params = { id: 'nonexistent' }
            mockRequest.body = { nom: 'Test' }

            await updateChantier(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(404)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Chantier non trouvé',
            })
        })

        it('should return 400 for invalid data', async () => {
            ; (prisma.chantier.findFirst as jest.Mock).mockResolvedValue({ id: 'chantier-1' })

            mockRequest.params = { id: 'chantier-1' }
            mockRequest.body = { nom: '' } // Empty nom will fail validation

            await updateChantier(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(400)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Données invalides',
                })
            )
        })

        it('should handle errors gracefully', async () => {
            ; (prisma.chantier.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

            mockRequest.params = { id: 'chantier-1' }
            mockRequest.body = { nom: 'Test' }

            await updateChantier(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Erreur serveur',
            })
        })
    })

    describe('deleteChantier', () => {
        it('should delete chantier successfully', async () => {
            ; (prisma.chantier.findUnique as jest.Mock).mockResolvedValue({ id: 'chantier-1' })
                ; (prisma.chantier.delete as jest.Mock).mockResolvedValue({ id: 'chantier-1' })

            mockRequest.params = { id: 'chantier-1' }

            await deleteChantier(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Chantier supprimé avec succès',
            })
        })

        it('should return 404 if chantier not found', async () => {
            ; (prisma.chantier.findUnique as jest.Mock).mockResolvedValue(null)

            mockRequest.params = { id: 'nonexistent' }

            await deleteChantier(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(404)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Chantier non trouvé',
            })
        })

        it('should handle errors gracefully', async () => {
            ; (prisma.chantier.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

            mockRequest.params = { id: 'chantier-1' }

            await deleteChantier(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Erreur serveur',
            })
        })
    })

    describe('getChantierStats', () => {
        it('should return chantier statistics', async () => {
            const mockStats = {
                _sum: { heuresTotales: 200 },
                _count: 25,
            }
            const mockFrais = {
                _sum: { montant: 750 },
            }
            const mockMonteurs = [{ monteurId: 'monteur-1' }, { monteurId: 'monteur-2' }]

                ; (prisma.feuilleTravail.aggregate as jest.Mock).mockResolvedValue(mockStats)
                ; (prisma.frais.aggregate as jest.Mock).mockResolvedValue(mockFrais)
                ; (prisma.feuilleTravail.findMany as jest.Mock).mockResolvedValue(mockMonteurs)

            mockRequest.params = { id: 'chantier-1' }

            await getChantierStats(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    heuresTotal: 200,
                    nombreFeuilles: 25,
                    fraisTotal: 750,
                    nombreMonteurs: 2,
                },
            })
        })

        it('should handle null values in aggregates', async () => {
            const mockStats = {
                _sum: { heuresTotales: null },
                _count: 0,
            }
            const mockFrais = {
                _sum: { montant: null },
            }

                ; (prisma.feuilleTravail.aggregate as jest.Mock).mockResolvedValue(mockStats)
                ; (prisma.frais.aggregate as jest.Mock).mockResolvedValue(mockFrais)
                ; (prisma.feuilleTravail.findMany as jest.Mock).mockResolvedValue([])

            mockRequest.params = { id: 'chantier-1' }

            await getChantierStats(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    heuresTotal: 0,
                    nombreFeuilles: 0,
                    fraisTotal: 0,
                    nombreMonteurs: 0,
                },
            })
        })

        it('should handle errors gracefully', async () => {
            ; (prisma.feuilleTravail.aggregate as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            mockRequest.params = { id: 'chantier-1' }

            await getChantierStats(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Erreur serveur',
            })
        })
    })
})
