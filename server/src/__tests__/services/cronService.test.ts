import { listJobs, toggleJob, runJobManually, resetJobsState } from '../../services/cronService'
import { prisma } from '../../config/database'
import { storageService } from '../../services/s3Service'
import { cleanExpiredRefreshTokens } from '../../utils/refreshToken'

// Mock dependencies
jest.mock('../../config/database')
jest.mock('../../services/s3Service')
jest.mock('../../utils/refreshToken')
jest.mock('node-cron', () => ({
    schedule: jest.fn(),
}))

describe('Cron Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        resetJobsState()
    })

    describe('listJobs', () => {
        it('should return list of registered jobs', () => {
            const jobs = listJobs()

            expect(jobs).toBeInstanceOf(Array)
            expect(jobs.length).toBeGreaterThan(0)

            // Verify job structure
            jobs.forEach((job) => {
                expect(job).toHaveProperty('name')
                expect(job).toHaveProperty('schedule')
                expect(job).toHaveProperty('enabled')
                expect(typeof job.name).toBe('string')
                expect(typeof job.schedule).toBe('string')
                expect(typeof job.enabled).toBe('boolean')
            })
        })

        it('should include expected job names', () => {
            const jobs = listJobs()
            const jobNames = jobs.map((j) => j.name)

            expect(jobNames).toContain('Rappel feuilles brouillon')
            expect(jobNames).toContain('Rappel feuilles en attente')
            expect(jobNames).toContain('Nettoyage fichiers orphelins')
            expect(jobNames).toContain('Nettoyage refresh tokens expirés')
            expect(jobNames).toContain('Statistiques quotidiennes')
            expect(jobNames).toContain('Rapport hebdomadaire')
        })

        it('should have valid cron schedules', () => {
            const jobs = listJobs()

            jobs.forEach((job) => {
                // Basic cron format validation (5 or 6 parts)
                const parts = job.schedule.split(' ')
                expect(parts.length).toBeGreaterThanOrEqual(5)
                expect(parts.length).toBeLessThanOrEqual(6)
            })
        })
    })

    describe('toggleJob', () => {
        it('should enable a job successfully', () => {
            const result = toggleJob('Rappel feuilles brouillon', true)

            expect(result).toBe(true)

            const jobs = listJobs()
            const job = jobs.find((j) => j.name === 'Rappel feuilles brouillon')
            expect(job?.enabled).toBe(true)
        })

        it('should disable a job successfully', () => {
            const result = toggleJob('Rappel feuilles en attente', false)

            expect(result).toBe(true)

            const jobs = listJobs()
            const job = jobs.find((j) => j.name === 'Rappel feuilles en attente')
            expect(job?.enabled).toBe(false)
        })

        it('should return false for non-existent job', () => {
            const result = toggleJob('NonExistentJob', true)

            expect(result).toBe(false)
        })

        it('should toggle job state multiple times', () => {
            const jobName = 'Nettoyage fichiers orphelins'

            toggleJob(jobName, false)
            let jobs = listJobs()
            let job = jobs.find((j) => j.name === jobName)
            expect(job?.enabled).toBe(false)

            toggleJob(jobName, true)
            jobs = listJobs()
            job = jobs.find((j) => j.name === jobName)
            expect(job?.enabled).toBe(true)
        })
    })

    describe('runJobManually', () => {
        it('should execute refresh token cleanup job', async () => {
            ; (cleanExpiredRefreshTokens as jest.Mock).mockResolvedValue(5)

            const result = await runJobManually('Nettoyage refresh tokens expirés')

            expect(result).toBe(true)
            expect(cleanExpiredRefreshTokens).toHaveBeenCalled()
        })

        it('should execute draft reminder job', async () => {
            const mockFeuilles = [
                {
                    id: 'feuille-1',
                    statut: 'BROUILLON',
                    monteur: { nom: 'Dupont', prenom: 'Jean' },
                    chantier: { nom: 'Chantier 1' },
                },
            ]

                ; (prisma.feuilleTravail.findMany as jest.Mock).mockResolvedValue(mockFeuilles)

            const result = await runJobManually('Rappel feuilles brouillon')

            expect(result).toBe(true)
            expect(prisma.feuilleTravail.findMany).toHaveBeenCalled()
        })

        it('should execute pending reminder job', async () => {
            const mockFeuilles = [
                {
                    id: 'feuille-1',
                },
            ]
                ; (prisma.feuilleTravail.findMany as jest.Mock).mockResolvedValue(mockFeuilles)
                ; (prisma.user.findMany as jest.Mock).mockResolvedValue([{ email: 'admin@test.com' }])

            const result = await runJobManually('Rappel feuilles en attente')

            expect(result).toBe(true)
            expect(prisma.feuilleTravail.findMany).toHaveBeenCalled()
            expect(prisma.user.findMany).toHaveBeenCalled()
        })

        it('should execute orphan files cleanup job', async () => {
            const mockOrphanFiles = [
                {
                    id: 'file-1',
                    nom: 'orphan.pdf',
                    cle: 'uploads/orphan.pdf',
                },
            ]

                ; (prisma.fichier.findMany as jest.Mock).mockResolvedValue(mockOrphanFiles)
                ; (storageService.delete as jest.Mock).mockResolvedValue(undefined)
                ; (prisma.fichier.delete as jest.Mock).mockResolvedValue(mockOrphanFiles[0])

            const result = await runJobManually('Nettoyage fichiers orphelins')

            expect(result).toBe(true)
            expect(prisma.fichier.findMany).toHaveBeenCalled()
            expect(storageService.delete).toHaveBeenCalledWith('uploads/orphan.pdf')
            expect(prisma.fichier.delete).toHaveBeenCalledWith({ where: { id: 'file-1' } })
        })

        it('should execute daily statistics job', async () => {
            ; (prisma.feuilleTravail.groupBy as jest.Mock).mockResolvedValue([
                { statut: 'VALIDE', _count: 10 },
                { statut: 'BROUILLON', _count: 5 },
            ])
                ; (prisma.feuilleTravail.aggregate as jest.Mock).mockResolvedValue({
                    _sum: { heuresTotales: 80 },
                })
                ; (prisma.monteur.count as jest.Mock).mockResolvedValue(2)

            const result = await runJobManually('Statistiques quotidiennes')

            expect(result).toBe(true)
            expect(prisma.feuilleTravail.groupBy).toHaveBeenCalled()
            expect(prisma.feuilleTravail.aggregate).toHaveBeenCalled()
            expect(prisma.monteur.count).toHaveBeenCalled()
        })

        it('should execute weekly report job', async () => {
            ; (prisma.feuilleTravail.count as jest.Mock).mockResolvedValue(50)
                ; (prisma.feuilleTravail.aggregate as jest.Mock).mockResolvedValue({
                    _sum: { heuresTotales: 400 },
                })
                ; (prisma.frais.aggregate as jest.Mock).mockResolvedValue({
                    _sum: { montant: 1500 },
                })
                ; (prisma.feuilleTravail.groupBy as jest.Mock).mockResolvedValue([
                    { monteurId: 'monteur-1', _sum: { heuresTotales: 40 } },
                ])

            const result = await runJobManually('Rapport hebdomadaire')

            expect(result).toBe(true)
            expect(prisma.feuilleTravail.count).toHaveBeenCalled()
            expect(prisma.feuilleTravail.aggregate).toHaveBeenCalled()
            expect(prisma.frais.aggregate).toHaveBeenCalled()
            expect(prisma.feuilleTravail.groupBy).toHaveBeenCalled()
        })

        it('should return false for non-existent job', async () => {
            const result = await runJobManually('NonExistentJob')

            expect(result).toBe(false)
        })

        it('should handle job execution errors gracefully', async () => {
            ; (cleanExpiredRefreshTokens as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            // Should not throw, just log the error
            await expect(
                runJobManually('Nettoyage refresh tokens expirés')
            ).resolves.toBe(true)
        })
    })

    describe('Job Registration', () => {
        it('should have all jobs enabled by default', () => {
            const jobs = listJobs()

            jobs.forEach((job) => {
                expect(job.enabled).toBe(true)
            })
        })

        it('should have unique job names', () => {
            const jobs = listJobs()
            const names = jobs.map((j) => j.name)
            const uniqueNames = new Set(names)

            expect(uniqueNames.size).toBe(names.length)
        })
    })
})
