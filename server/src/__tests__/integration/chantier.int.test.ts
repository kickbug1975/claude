import request from 'supertest'
import app from '../../index'
import { prisma } from '../../config/database'

describe('Chantier Integration Tests', () => {
    let adminToken: string
    let monteurToken: string

    const validChantierData = {
        nom: 'Chantier Tour Eiffel',
        adresse: 'Champ de Mars, 75007 Paris',
        client: 'Ville de Paris',
        reference: 'REF-2024-001',
        dateDebut: new Date().toISOString(),
        description: 'Maintenance de la structure métallique',
    }

    beforeAll(async () => {
        // Créer un admin
        const adminRes = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'admin@chantier.com',
                password: 'Password123!',
                role: 'ADMIN',
            })
        adminToken = adminRes.body.data.token

        // Créer un monteur
        const monteurRes = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'user@chantier.com',
                password: 'Password123!',
                role: 'MONTEUR',
            })
        monteurToken = monteurRes.body.data.token
    })

    describe('POST /api/chantiers', () => {
        it('should create a chantier if user is admin', async () => {
            const response = await request(app)
                .post('/api/chantiers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validChantierData)

            expect(response.status).toBe(201)
            expect(response.body.success).toBe(true)
            expect(response.body.data.reference).toBe(validChantierData.reference)
        })

        it('should return 403 if user is not admin', async () => {
            const response = await request(app)
                .post('/api/chantiers')
                .set('Authorization', `Bearer ${monteurToken}`)
                .send({ ...validChantierData, reference: 'REF-ANON' })

            expect(response.status).toBe(403)
        })
    })

    describe('GET /api/chantiers', () => {
        it('should return list of chantiers', async () => {
            const response = await request(app)
                .get('/api/chantiers')
                .set('Authorization', `Bearer ${monteurToken}`)

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(Array.isArray(response.body.data)).toBe(true)
        })
    })

    describe('GET /api/chantiers/:id', () => {
        let chantierId: string

        beforeEach(async () => {
            const c = await prisma.chantier.create({
                data: {
                    nom: 'Chantier Test',
                    adresse: 'Adresse Test',
                    client: 'Client Test',
                    reference: 'REF-TEST-' + Math.random(),
                    dateDebut: new Date(),
                    description: 'Description Test'
                }
            })
            chantierId = c.id
        })

        it('should return chantier details', async () => {
            const response = await request(app)
                .get(`/api/chantiers/${chantierId}`)
                .set('Authorization', `Bearer ${monteurToken}`)

            expect(response.status).toBe(200)
            expect(response.body.data.nom).toBe('Chantier Test')
        })
    })
})
