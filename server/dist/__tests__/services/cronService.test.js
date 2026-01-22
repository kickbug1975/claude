"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cronService_1 = require("../../services/cronService");
const database_1 = require("../../config/database");
const s3Service_1 = require("../../services/s3Service");
const refreshToken_1 = require("../../utils/refreshToken");
// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../services/s3Service');
jest.mock('../../utils/refreshToken');
jest.mock('node-cron', () => ({
    schedule: jest.fn(),
}));
describe('Cron Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (0, cronService_1.resetJobsState)();
    });
    describe('listJobs', () => {
        it('should return list of registered jobs', () => {
            const jobs = (0, cronService_1.listJobs)();
            expect(jobs).toBeInstanceOf(Array);
            expect(jobs.length).toBeGreaterThan(0);
            // Verify job structure
            jobs.forEach((job) => {
                expect(job).toHaveProperty('name');
                expect(job).toHaveProperty('schedule');
                expect(job).toHaveProperty('enabled');
                expect(typeof job.name).toBe('string');
                expect(typeof job.schedule).toBe('string');
                expect(typeof job.enabled).toBe('boolean');
            });
        });
        it('should include expected job names', () => {
            const jobs = (0, cronService_1.listJobs)();
            const jobNames = jobs.map((j) => j.name);
            expect(jobNames).toContain('Rappel feuilles brouillon');
            expect(jobNames).toContain('Rappel feuilles en attente');
            expect(jobNames).toContain('Nettoyage fichiers orphelins');
            expect(jobNames).toContain('Nettoyage refresh tokens expirés');
            expect(jobNames).toContain('Statistiques quotidiennes');
            expect(jobNames).toContain('Rapport hebdomadaire');
        });
        it('should have valid cron schedules', () => {
            const jobs = (0, cronService_1.listJobs)();
            jobs.forEach((job) => {
                // Basic cron format validation (5 or 6 parts)
                const parts = job.schedule.split(' ');
                expect(parts.length).toBeGreaterThanOrEqual(5);
                expect(parts.length).toBeLessThanOrEqual(6);
            });
        });
    });
    describe('toggleJob', () => {
        it('should enable a job successfully', () => {
            const result = (0, cronService_1.toggleJob)('Rappel feuilles brouillon', true);
            expect(result).toBe(true);
            const jobs = (0, cronService_1.listJobs)();
            const job = jobs.find((j) => j.name === 'Rappel feuilles brouillon');
            expect(job?.enabled).toBe(true);
        });
        it('should disable a job successfully', () => {
            const result = (0, cronService_1.toggleJob)('Rappel feuilles en attente', false);
            expect(result).toBe(true);
            const jobs = (0, cronService_1.listJobs)();
            const job = jobs.find((j) => j.name === 'Rappel feuilles en attente');
            expect(job?.enabled).toBe(false);
        });
        it('should return false for non-existent job', () => {
            const result = (0, cronService_1.toggleJob)('NonExistentJob', true);
            expect(result).toBe(false);
        });
        it('should toggle job state multiple times', () => {
            const jobName = 'Nettoyage fichiers orphelins';
            (0, cronService_1.toggleJob)(jobName, false);
            let jobs = (0, cronService_1.listJobs)();
            let job = jobs.find((j) => j.name === jobName);
            expect(job?.enabled).toBe(false);
            (0, cronService_1.toggleJob)(jobName, true);
            jobs = (0, cronService_1.listJobs)();
            job = jobs.find((j) => j.name === jobName);
            expect(job?.enabled).toBe(true);
        });
    });
    describe('runJobManually', () => {
        it('should execute refresh token cleanup job', async () => {
            ;
            refreshToken_1.cleanExpiredRefreshTokens.mockResolvedValue(5);
            const result = await (0, cronService_1.runJobManually)('Nettoyage refresh tokens expirés');
            expect(result).toBe(true);
            expect(refreshToken_1.cleanExpiredRefreshTokens).toHaveBeenCalled();
        });
        it('should execute draft reminder job', async () => {
            const mockFeuilles = [
                {
                    id: 'feuille-1',
                    statut: 'BROUILLON',
                    monteur: { nom: 'Dupont', prenom: 'Jean' },
                    chantier: { nom: 'Chantier 1' },
                },
            ];
            database_1.prisma.feuilleTravail.findMany.mockResolvedValue(mockFeuilles);
            const result = await (0, cronService_1.runJobManually)('Rappel feuilles brouillon');
            expect(result).toBe(true);
            expect(database_1.prisma.feuilleTravail.findMany).toHaveBeenCalled();
        });
        it('should execute pending reminder job', async () => {
            const mockFeuilles = [
                {
                    id: 'feuille-1',
                },
            ];
            database_1.prisma.feuilleTravail.findMany.mockResolvedValue(mockFeuilles);
            database_1.prisma.user.findMany.mockResolvedValue([{ email: 'admin@test.com' }]);
            const result = await (0, cronService_1.runJobManually)('Rappel feuilles en attente');
            expect(result).toBe(true);
            expect(database_1.prisma.feuilleTravail.findMany).toHaveBeenCalled();
            expect(database_1.prisma.user.findMany).toHaveBeenCalled();
        });
        it('should execute orphan files cleanup job', async () => {
            const mockOrphanFiles = [
                {
                    id: 'file-1',
                    nom: 'orphan.pdf',
                    cle: 'uploads/orphan.pdf',
                },
            ];
            database_1.prisma.fichier.findMany.mockResolvedValue(mockOrphanFiles);
            s3Service_1.storageService.delete.mockResolvedValue(undefined);
            database_1.prisma.fichier.delete.mockResolvedValue(mockOrphanFiles[0]);
            const result = await (0, cronService_1.runJobManually)('Nettoyage fichiers orphelins');
            expect(result).toBe(true);
            expect(database_1.prisma.fichier.findMany).toHaveBeenCalled();
            expect(s3Service_1.storageService.delete).toHaveBeenCalledWith('uploads/orphan.pdf');
            expect(database_1.prisma.fichier.delete).toHaveBeenCalledWith({ where: { id: 'file-1' } });
        });
        it('should execute daily statistics job', async () => {
            ;
            database_1.prisma.feuilleTravail.groupBy.mockResolvedValue([
                { statut: 'VALIDE', _count: 10 },
                { statut: 'BROUILLON', _count: 5 },
            ]);
            database_1.prisma.feuilleTravail.aggregate.mockResolvedValue({
                _sum: { heuresTotales: 80 },
            });
            database_1.prisma.monteur.count.mockResolvedValue(2);
            const result = await (0, cronService_1.runJobManually)('Statistiques quotidiennes');
            expect(result).toBe(true);
            expect(database_1.prisma.feuilleTravail.groupBy).toHaveBeenCalled();
            expect(database_1.prisma.feuilleTravail.aggregate).toHaveBeenCalled();
            expect(database_1.prisma.monteur.count).toHaveBeenCalled();
        });
        it('should execute weekly report job', async () => {
            ;
            database_1.prisma.feuilleTravail.count.mockResolvedValue(50);
            database_1.prisma.feuilleTravail.aggregate.mockResolvedValue({
                _sum: { heuresTotales: 400 },
            });
            database_1.prisma.frais.aggregate.mockResolvedValue({
                _sum: { montant: 1500 },
            });
            database_1.prisma.feuilleTravail.groupBy.mockResolvedValue([
                { monteurId: 'monteur-1', _sum: { heuresTotales: 40 } },
            ]);
            const result = await (0, cronService_1.runJobManually)('Rapport hebdomadaire');
            expect(result).toBe(true);
            expect(database_1.prisma.feuilleTravail.count).toHaveBeenCalled();
            expect(database_1.prisma.feuilleTravail.aggregate).toHaveBeenCalled();
            expect(database_1.prisma.frais.aggregate).toHaveBeenCalled();
            expect(database_1.prisma.feuilleTravail.groupBy).toHaveBeenCalled();
        });
        it('should return false for non-existent job', async () => {
            const result = await (0, cronService_1.runJobManually)('NonExistentJob');
            expect(result).toBe(false);
        });
        it('should handle job execution errors gracefully', async () => {
            ;
            refreshToken_1.cleanExpiredRefreshTokens.mockRejectedValue(new Error('Database error'));
            // Should not throw, just log the error
            await expect((0, cronService_1.runJobManually)('Nettoyage refresh tokens expirés')).resolves.toBe(true);
        });
    });
    describe('Job Registration', () => {
        it('should have all jobs enabled by default', () => {
            const jobs = (0, cronService_1.listJobs)();
            jobs.forEach((job) => {
                expect(job.enabled).toBe(true);
            });
        });
        it('should have unique job names', () => {
            const jobs = (0, cronService_1.listJobs)();
            const names = jobs.map((j) => j.name);
            const uniqueNames = new Set(names);
            expect(uniqueNames.size).toBe(names.length);
        });
    });
});
//# sourceMappingURL=cronService.test.js.map