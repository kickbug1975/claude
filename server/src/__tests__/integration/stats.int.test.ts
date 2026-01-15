import request from 'supertest'
import app from '../../index'
import { prisma } from '../../config/database'

describe('Stats Integration Tests', () => {
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
        adminToken = await getAuthToken('admin@stats.com', 'ADMIN')
        monteurToken = await getAuthToken('user@stats.com', 'MONTEUR')

        // Créer un monteur AVEC un email unique (ou réutiliser si existe)
        const emailMonteur = 'stats@test.com'
        let m = await prisma.monteur.findUnique({ where: { email: emailMonteur } })

        if (!m) {
            m = await prisma.monteur.create({
                data: {
                    nom: 'Stats',
                    prenom: 'User',
                    email: emailMonteur,
                    telephone: '0000000000',
                    adresse: 'Test',
                    dateEmbauche: new Date(),
                    numeroIdentification: 'STATS-ID-' + Math.random()
                }
            })
        }
        monteurId = m.id

        // Lier le monteur au user créé par register
        await prisma.user.update({
            where: { email: 'user@stats.com' },
            data: { monteurId: m.id }
        })

        // Créer un chantier
        const c = await prisma.chantier.create({
            data: {
                nom: 'Chantier Stats',
                adresse: 'Test',
                client: 'Test',
                reference: 'REF-STATS-' + Math.random(),
                dateDebut: new Date(),
                description: 'Test'
            }
        })
        chantierId = c.id

        // Créer quelques feuilles de travail validées pour le mois en cours
        await prisma.feuilleTravail.createMany({
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
        })
    })

    describe('GET /api/monteurs/:id/stats', () => {
        it('should return monteur stats for admin', async () => {
            const response = await request(app)
                .get(`/api/monteurs/${monteurId}/stats`)
                .set('Authorization', `Bearer ${adminToken}`)

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.data).toHaveProperty('heuresTotal')
            expect(response.body.data.heuresTotal).toBe(8)
        })

        it('should return 200 with zeros for non-existent monteur stats (as per implementation)', async () => {
            const response = await request(app)
                .get('/api/monteurs/ffffffff-ffff-ffff-ffff-ffffffffffff/stats')
                .set('Authorization', `Bearer ${adminToken}`)

            expect(response.status).toBe(200)
            expect(response.body.data.heuresTotal).toBe(0)
        })
    })

    describe('GET /api/chantiers/:id/stats', () => {
        it('should return chantier stats', async () => {
            const response = await request(app)
                .get(`/api/chantiers/${chantierId}/stats`)
                .set('Authorization', `Bearer ${monteurToken}`)

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.data).toHaveProperty('heuresTotal')
            expect(response.body.data.heuresTotal).toBe(8)
        })
    })
})
