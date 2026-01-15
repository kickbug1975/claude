import request from 'supertest'
import app from '../../index'
import { prisma } from '../../config/database'
import { StatutFeuille } from '@prisma/client'

describe('Feuille Integration Tests', () => {
    let adminToken: string
    let monteurToken: string
    let monteurId: string
    let chantierId: string

    async function getAuthToken(email: string, role: string) {
        const registerRes = await request(app)
            .post('/api/auth/register')
            .send({
                email,
                password: 'Password123!',
                role,
            })

        if (registerRes.body.data && registerRes.body.data.token) {
            return registerRes.body.data.token
        }

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email,
                password: 'Password123!',
            })

        return loginRes.body.data.token
    }

    beforeAll(async () => {
        adminToken = await getAuthToken('admin@feuille.com', 'ADMIN')
        monteurToken = await getAuthToken('monteur@feuille.com', 'MONTEUR')

        // Récupérer ou créer le monteurId associé
        let user = await prisma.user.findUnique({
            where: { email: 'monteur@feuille.com' },
            include: { monteur: true },
        })

        if (!user) {
            throw new Error('User monteur@feuille.com not found after registration')
        }

        if (user.monteur) {
            monteurId = user.monteur.id
        } else {
            // Créer le monteur si pas encore créé
            const m = await prisma.monteur.create({
                data: {
                    prenom: 'Test',
                    nom: 'Monteur',
                    email: 'monteur@feuille.com',
                    telephone: '0123456789',
                    adresse: '123 Rue Test',
                    dateEmbauche: new Date(),
                    numeroIdentification: 'FEUILLE-M-' + Math.random(),
                    user: { connect: { id: user.id } }
                }
            })
            monteurId = m.id
        }

        // Vérifier que monteurId est défini
        if (!monteurId) {
            throw new Error('monteurId was not initialized properly')
        }

        // Créer un chantier
        const chantier = await prisma.chantier.create({
            data: {
                nom: 'Chantier Test Feuille',
                reference: 'REF-FEUILLE-' + Math.random(),
                client: 'Client Test',
                adresse: '456 Avenue Test',
                description: 'Chantier pour tests',
                dateDebut: new Date(),
                actif: true,
            },
        })
        chantierId = chantier.id

        // Vérifier que chantierId est défini
        if (!chantierId) {
            throw new Error('chantierId was not initialized properly')
        }
    })

    describe('POST /api/feuilles', () => {
        it('should create a new feuille as monochrome', async () => {
            const feuilleData = {
                monteurId,
                chantierId,
                dateTravail: new Date().toISOString(),
                heureDebut: '08:00',
                heureFin: '17:00',
                heuresTotales: 8.5,
                descriptionTravail: 'Installation de composants',
                frais: [
                    { typeFrais: 'REPAS', montant: 15.5, description: 'Déjeuner' }
                ]
            }

            const response = await request(app)
                .post('/api/feuilles')
                .set('Authorization', `Bearer ${monteurToken}`)
                .send(feuilleData)

            expect(response.status).toBe(201)
            expect(response.body.success).toBe(true)
            expect(response.body.data.statut).toBe(StatutFeuille.BROUILLON)
        })
    })

    describe('GET /api/feuilles', () => {
        it('should return list of feuilles for the monteur', async () => {
            const response = await request(app)
                .get('/api/feuilles')
                .set('Authorization', `Bearer ${monteurToken}`)

            expect(response.status).toBe(200)
            expect(Array.isArray(response.body.data)).toBe(true)
        })
    })

    describe('POST /api/feuilles/:id/submit', () => {
        it('should allow monteur to submit their own feuille', async () => {
            const feuille = await prisma.feuilleTravail.create({
                data: {
                    monteurId,
                    chantierId,
                    dateTravail: new Date(),
                    heureDebut: '08:00',
                    heureFin: '12:00',
                    heuresTotales: 4,
                    descriptionTravail: 'Test submit',
                    statut: StatutFeuille.BROUILLON
                }
            })

            const response = await request(app)
                .post(`/api/feuilles/${feuille.id}/submit`)
                .set('Authorization', `Bearer ${monteurToken}`)

            expect(response.status).toBe(200)
            expect(response.body.data.statut).toBe('SOUMIS')
        })
    })

    describe('POST /api/feuilles/:id/validate', () => {
        it('should validate a feuille if user is admin', async () => {
            // Vérifier que monteurId et chantierId sont définis
            expect(monteurId).toBeDefined()
            expect(chantierId).toBeDefined()

            // Créer une feuille via l'API
            const createRes = await request(app)
                .post('/api/feuilles')
                .set('Authorization', `Bearer ${monteurToken}`)
                .send({
                    monteurId,
                    chantierId,
                    dateTravail: new Date().toISOString(),
                    heureDebut: '08:00',
                    heureFin: '12:00',
                    descriptionTravail: 'Test validation',
                })

            // Vérifier que la création a réussi
            expect(createRes.status).toBe(201)
            expect(createRes.body.data).toBeDefined()
            expect(createRes.body.data.id).toBeDefined()

            const feuilleId = createRes.body.data.id

            // Soumettre la feuille
            const submitRes = await request(app)
                .post(`/api/feuilles/${feuilleId}/submit`)
                .set('Authorization', `Bearer ${monteurToken}`)

            expect(submitRes.status).toBe(200)

            // Valider la feuille
            const response = await request(app)
                .post(`/api/feuilles/${feuilleId}/validate`)
                .set('Authorization', `Bearer ${adminToken}`)

            expect(response.status).toBe(200)
            expect(response.body.data.statut).toBe('VALIDE')
        })

        it('should fail if a monteur tries to validate', async () => {
            // Vérifier que monteurId et chantierId sont définis
            expect(monteurId).toBeDefined()
            expect(chantierId).toBeDefined()

            // Créer une feuille via l'API
            const createRes = await request(app)
                .post('/api/feuilles')
                .set('Authorization', `Bearer ${monteurToken}`)
                .send({
                    monteurId,
                    chantierId,
                    dateTravail: new Date().toISOString(),
                    heureDebut: '08:00',
                    heureFin: '12:00',
                    descriptionTravail: 'Test validation monteur',
                })

            // Vérifier que la création a réussi
            expect(createRes.status).toBe(201)
            expect(createRes.body.data).toBeDefined()

            const feuilleId = createRes.body.data.id

            // Soumettre la feuille
            const submitRes = await request(app)
                .post(`/api/feuilles/${feuilleId}/submit`)
                .set('Authorization', `Bearer ${monteurToken}`)

            expect(submitRes.status).toBe(200)

            // Essayer de valider avec le token monteur (devrait échouer)
            const response = await request(app)
                .post(`/api/feuilles/${feuilleId}/validate`)
                .set('Authorization', `Bearer ${monteurToken}`)

            expect(response.status).toBe(403)
        })
    })

    describe('POST /api/feuilles/:id/reject', () => {
        it('should allow admin to reject a feuille', async () => {
            // Vérifier que monteurId et chantierId sont définis
            expect(monteurId).toBeDefined()
            expect(chantierId).toBeDefined()

            // Créer une feuille via l'API
            const createRes = await request(app)
                .post('/api/feuilles')
                .set('Authorization', `Bearer ${monteurToken}`)
                .send({
                    monteurId,
                    chantierId,
                    dateTravail: new Date().toISOString(),
                    heureDebut: '08:00',
                    heureFin: '12:00',
                    descriptionTravail: 'Test reject',
                })

            // Vérifier que la création a réussi
            expect(createRes.status).toBe(201)
            expect(createRes.body.data).toBeDefined()

            const feuilleId = createRes.body.data.id

            // Soumettre la feuille
            const submitRes = await request(app)
                .post(`/api/feuilles/${feuilleId}/submit`)
                .set('Authorization', `Bearer ${monteurToken}`)

            expect(submitRes.status).toBe(200)

            // Rejeter la feuille
            const response = await request(app)
                .post(`/api/feuilles/${feuilleId}/reject`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ commentaire: 'Incomplet' })

            expect(response.status).toBe(200)
            expect(response.body.data.statut).toBe('REJETE')
        })
    })
})
