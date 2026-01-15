import { Request, Response } from 'express'
import {
    getAllMonteurs,
    getMonteurById,
    createMonteur,
    updateMonteur,
    deleteMonteur,
    getMonteurStats,
} from '../../controllers/monteurController'
import { prisma } from '../../config/database'

describe('Monteur Controller', () => {
    let mockRequest: Partial<Request>
    let mockResponse: Partial<Response>

    beforeEach(() => {
        mockRequest = {
            body: {},
            params: {},
            query: {},
            user: undefined,
        }
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        }
        jest.clearAllMocks()
    })

    describe('getAllMonteurs', () => {
        it('should return paginated list of monteurs', async () => {
            const mockMonteurs = [
                {
                    id: 'monteur-1',
                    nom: 'Dupont',
                    prenom: 'Jean',
                    email: 'jean.dupont@example.com',
                    telephone: '0123456789',
                    adresse: '123 Rue Test',
                    dateEmbauche: new Date('2023-01-01'),
                    numeroIdentification: 'M001',
                    actif: true,
                    user: { id: 'user-1', email: 'jean.dupont@example.com', role: 'MONTEUR' },
                },
            ]

                ; (prisma.monteur.count as jest.Mock).mockResolvedValue(1)
                ; (prisma.monteur.findMany as jest.Mock).mockResolvedValue(mockMonteurs)

            mockRequest.query = { page: '1', limit: '10' }

            await getAllMonteurs(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockMonteurs,
                    pagination: expect.objectContaining({
                        page: 1,
                        pageSize: 10,
                        total: 1,
                    }),
                })
            )
        })

        it('should filter monteurs by actif status', async () => {
            ; (prisma.monteur.count as jest.Mock).mockResolvedValue(0)
                ; (prisma.monteur.findMany as jest.Mock).mockResolvedValue([])

            mockRequest.query = { actif: 'false' }

            await getAllMonteurs(mockRequest as Request, mockResponse as Response)

            expect(prisma.monteur.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { actif: false },
                })
            )
        })

        it('should handle errors gracefully', async () => {
            ; (prisma.monteur.count as jest.Mock).mockRejectedValue(new Error('Database error'))

            await getAllMonteurs(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Erreur serveur',
            })
        })
    })

    describe('getMonteurById', () => {
        it('should return monteur when found', async () => {
            const mockMonteur = {
                id: 'monteur-1',
                nom: 'Dupont',
                prenom: 'Jean',
                email: 'jean.dupont@example.com',
                telephone: '0123456789',
                adresse: '123 Rue Test',
                dateEmbauche: new Date('2023-01-01'),
                numeroIdentification: 'M001',
                actif: true,
                user: { id: 'user-1', email: 'jean.dupont@example.com', role: 'MONTEUR' },
                feuillesTravail: [],
            }

                ; (prisma.monteur.findUnique as jest.Mock).mockResolvedValue(mockMonteur)

            mockRequest.params = { id: 'monteur-1' }

            await getMonteurById(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockMonteur,
            })
        })

        it('should return 404 when monteur not found', async () => {
            ; (prisma.monteur.findUnique as jest.Mock).mockResolvedValue(null)

            mockRequest.params = { id: 'nonexistent' }

            await getMonteurById(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(404)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Monteur non trouvé',
            })
        })

        it('should handle errors gracefully', async () => {
            ; (prisma.monteur.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

            mockRequest.params = { id: 'monteur-1' }

            await getMonteurById(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Erreur serveur',
            })
        })
    })

    describe('createMonteur', () => {
        const validMonteurData = {
            nom: 'Dupont',
            prenom: 'Jean',
            email: 'jean.dupont@example.com',
            telephone: '0123456789',
            adresse: '123 Rue Test',
            dateEmbauche: '2023-01-01',
            numeroIdentification: 'M001',
            actif: true,
        }

        it('should create monteur with valid data', async () => {
            const mockCreatedMonteur = {
                id: 'monteur-1',
                ...validMonteurData,
                dateEmbauche: new Date('2023-01-01'),
                createdAt: new Date(),
                updatedAt: new Date(),
            }

                ; (prisma.monteur.findUnique as jest.Mock).mockResolvedValue(null)
                ; (prisma.monteur.create as jest.Mock).mockResolvedValue(mockCreatedMonteur)

            mockRequest.body = validMonteurData

            await createMonteur(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(201)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Monteur créé avec succès',
                data: mockCreatedMonteur,
            })
        })

        it('should return 400 for invalid data', async () => {
            mockRequest.body = {
                nom: '',
                email: 'invalid-email',
            }

            await createMonteur(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(400)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Données invalides',
                    errors: expect.any(Object),
                })
            )
        })

        it('should return 409 if email already exists', async () => {
            ; (prisma.monteur.findUnique as jest.Mock).mockResolvedValueOnce({
                id: 'existing-monteur',
                email: validMonteurData.email,
            })

            mockRequest.body = validMonteurData

            await createMonteur(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(409)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Cet email est déjà utilisé',
            })
        })

        it('should return 409 if numeroIdentification already exists', async () => {
            ; (prisma.monteur.findUnique as jest.Mock)
                .mockResolvedValueOnce(null) // email check
                .mockResolvedValueOnce({ id: 'existing-monteur', numeroIdentification: 'M001' }) // numero check

            mockRequest.body = validMonteurData

            await createMonteur(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(409)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: "Ce numéro d'identification est déjà utilisé",
            })
        })

        it('should handle errors gracefully', async () => {
            ; (prisma.monteur.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

            mockRequest.body = validMonteurData

            await createMonteur(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Erreur serveur',
            })
        })
    })

    describe('updateMonteur', () => {
        it('should update monteur with valid data', async () => {
            const mockUpdatedMonteur = {
                id: 'monteur-1',
                nom: 'Dupont Updated',
                prenom: 'Jean',
                email: 'jean.dupont@example.com',
                telephone: '0123456789',
                adresse: '123 Rue Test',
                dateEmbauche: new Date('2023-01-01'),
                numeroIdentification: 'M001',
                actif: true,
            }

                ; (prisma.monteur.findUnique as jest.Mock).mockResolvedValue({ id: 'monteur-1' })
                ; (prisma.monteur.update as jest.Mock).mockResolvedValue(mockUpdatedMonteur)

            mockRequest.params = { id: 'monteur-1' }
            mockRequest.body = { nom: 'Dupont Updated' }

            await updateMonteur(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Monteur mis à jour avec succès',
                data: mockUpdatedMonteur,
            })
        })

        it('should return 404 if monteur not found', async () => {
            ; (prisma.monteur.findUnique as jest.Mock).mockResolvedValue(null)

            mockRequest.params = { id: 'nonexistent' }
            mockRequest.body = { nom: 'Test' }

            await updateMonteur(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(404)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Monteur non trouvé',
            })
        })

        it('should return 400 for invalid data', async () => {
            mockRequest.params = { id: 'monteur-1' }
            mockRequest.body = { email: 'invalid-email' }

            await updateMonteur(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(400)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Données invalides',
                })
            )
        })

        it('should handle errors gracefully', async () => {
            ; (prisma.monteur.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

            mockRequest.params = { id: 'monteur-1' }
            mockRequest.body = { nom: 'Test' }

            await updateMonteur(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Erreur serveur',
            })
        })
    })

    describe('deleteMonteur', () => {
        it('should delete monteur successfully', async () => {
            ; (prisma.monteur.findUnique as jest.Mock).mockResolvedValue({ id: 'monteur-1' })
                ; (prisma.monteur.delete as jest.Mock).mockResolvedValue({ id: 'monteur-1' })

            mockRequest.params = { id: 'monteur-1' }

            await deleteMonteur(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Monteur supprimé avec succès',
            })
        })

        it('should return 404 if monteur not found', async () => {
            ; (prisma.monteur.findUnique as jest.Mock).mockResolvedValue(null)

            mockRequest.params = { id: 'nonexistent' }

            await deleteMonteur(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(404)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Monteur non trouvé',
            })
        })

        it('should handle errors gracefully', async () => {
            ; (prisma.monteur.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

            mockRequest.params = { id: 'monteur-1' }

            await deleteMonteur(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Erreur serveur',
            })
        })
    })

    describe('getMonteurStats', () => {
        it('should return monteur statistics', async () => {
            const mockStats = {
                _sum: { heuresTotales: 160 },
                _count: 20,
            }
            const mockFrais = {
                _sum: { montant: 500 },
            }

                ; (prisma.feuilleTravail.aggregate as jest.Mock).mockResolvedValue(mockStats)
                ; (prisma.frais.aggregate as jest.Mock).mockResolvedValue(mockFrais)

            mockRequest.params = { id: 'monteur-1' }
            mockRequest.query = { mois: '1', annee: '2024' }

            await getMonteurStats(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    periode: { mois: 1, annee: 2024 },
                    heuresTotal: 160,
                    nombreFeuilles: 20,
                    fraisTotal: 500,
                },
            })
        })

        it('should use current month/year if not provided', async () => {
            const mockStats = {
                _sum: { heuresTotales: 0 },
                _count: 0,
            }
            const mockFrais = {
                _sum: { montant: null },
            }

                ; (prisma.feuilleTravail.aggregate as jest.Mock).mockResolvedValue(mockStats)
                ; (prisma.frais.aggregate as jest.Mock).mockResolvedValue(mockFrais)

            mockRequest.params = { id: 'monteur-1' }
            mockRequest.query = {}

            await getMonteurStats(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    heuresTotal: 0,
                    nombreFeuilles: 0,
                    fraisTotal: 0,
                }),
            })
        })

        it('should handle errors gracefully', async () => {
            ; (prisma.feuilleTravail.aggregate as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            mockRequest.params = { id: 'monteur-1' }
            mockRequest.query = {}

            await getMonteurStats(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Erreur serveur',
            })
        })
    })
})
