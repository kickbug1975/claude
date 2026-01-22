"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetJobsState = exports.runJobManually = exports.toggleJob = exports.listJobs = exports.startCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const s3Service_1 = require("./s3Service");
const refreshToken_1 = require("../utils/refreshToken");
// Liste des jobs
const jobs = [];
/**
 * Enregistrer un job cron
 */
const registerJob = (job) => {
    jobs.push(job);
};
/**
 * Démarrer tous les jobs cron
 */
const startCronJobs = () => {
    logger_1.logger.info('Démarrage des tâches planifiées...');
    jobs.forEach((job) => {
        if (job.enabled) {
            node_cron_1.default.schedule(job.schedule, async () => {
                logger_1.logger.info(`[CRON] Exécution: ${job.name}`);
                const startTime = Date.now();
                try {
                    await job.task();
                    const duration = Date.now() - startTime;
                    logger_1.logger.success(`[CRON] ${job.name} terminé en ${duration}ms`);
                }
                catch (error) {
                    logger_1.logger.error(`[CRON] Erreur ${job.name}:`, error);
                }
            });
            logger_1.logger.info(`[CRON] Job enregistré: ${job.name} (${job.schedule})`);
        }
    });
    logger_1.logger.success(`${jobs.filter((j) => j.enabled).length} tâche(s) planifiée(s) démarrée(s)`);
};
exports.startCronJobs = startCronJobs;
// =====================================================
// JOB 1: Rappel pour feuilles en brouillon
// Exécution: Tous les jours à 9h00
// =====================================================
registerJob({
    name: 'Rappel feuilles brouillon',
    schedule: '0 9 * * *', // Tous les jours à 9h00
    enabled: true,
    task: async () => {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const feuillesBrouillon = await database_1.prisma.feuilleTravail.findMany({
            where: {
                statut: 'BROUILLON',
                updatedAt: {
                    lt: oneDayAgo,
                },
            },
            include: {
                monteur: true,
            },
        });
        if (feuillesBrouillon.length > 0) {
            logger_1.logger.info(`[CRON] ${feuillesBrouillon.length} feuille(s) en brouillon trouvée(s)`);
            for (const feuille of feuillesBrouillon) {
                logger_1.logger.info(`[CRON] Rappel: Feuille ${feuille.id.substring(0, 8)} - ${feuille.monteur.prenom} ${feuille.monteur.nom}`);
            }
        }
    },
});
// =====================================================
// JOB 2: Rappel pour feuilles en attente de validation
// Exécution: Tous les jours à 10h00
// =====================================================
registerJob({
    name: 'Rappel feuilles en attente',
    schedule: '0 10 * * *', // Tous les jours à 10h00
    enabled: true,
    task: async () => {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const feuillesEnAttente = await database_1.prisma.feuilleTravail.findMany({
            where: {
                statut: 'SOUMIS',
                updatedAt: {
                    lt: twoDaysAgo,
                },
            },
            include: {
                monteur: true,
            },
        });
        if (feuillesEnAttente.length > 0) {
            const superviseurs = await database_1.prisma.user.findMany({
                where: {
                    role: { in: ['ADMIN', 'SUPERVISEUR'] },
                },
                select: { email: true },
            });
            logger_1.logger.info(`[CRON] ${feuillesEnAttente.length} feuille(s) en attente - ${superviseurs.length} superviseur(s) à notifier`);
        }
    },
});
// =====================================================
// JOB 3: Nettoyage des fichiers orphelins
// Exécution: Tous les dimanches à 3h00
// =====================================================
registerJob({
    name: 'Nettoyage fichiers orphelins',
    schedule: '0 3 * * 0', // Tous les dimanches à 3h00
    enabled: true,
    task: async () => {
        // Trouver les fichiers sans feuille associée et créés il y a plus de 7 jours
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const fichiersOrphelins = await database_1.prisma.fichier.findMany({
            where: {
                feuilleId: null,
                createdAt: {
                    lt: sevenDaysAgo,
                },
            },
        });
        logger_1.logger.info(`[CRON] ${fichiersOrphelins.length} fichier(s) orphelin(s) trouvé(s)`);
        // Supprimer les fichiers orphelins
        for (const fichier of fichiersOrphelins) {
            try {
                await s3Service_1.storageService.delete(fichier.cle);
                await database_1.prisma.fichier.delete({ where: { id: fichier.id } });
                logger_1.logger.info(`[CRON] Fichier orphelin supprimé: ${fichier.nom}`);
            }
            catch (error) {
                logger_1.logger.error(`[CRON] Erreur suppression fichier ${fichier.id}:`, error);
            }
        }
        if (fichiersOrphelins.length > 0) {
            logger_1.logger.success(`[CRON] ${fichiersOrphelins.length} fichier(s) orphelin(s) supprimé(s)`);
        }
    },
});
// =====================================================
// JOB 4: Nettoyage des refresh tokens expirés
// Exécution: Tous les jours à 2h00
// =====================================================
registerJob({
    name: 'Nettoyage refresh tokens expirés',
    schedule: '0 2 * * *', // Tous les jours à 2h00
    enabled: true,
    task: async () => {
        const deletedCount = await (0, refreshToken_1.cleanExpiredRefreshTokens)();
        logger_1.logger.info(`[CRON] ${deletedCount} refresh token(s) expiré(s) supprimé(s)`);
    },
});
// =====================================================
// JOB 5: Génération de statistiques quotidiennes
// Exécution: Tous les jours à 23h55
// =====================================================
registerJob({
    name: 'Statistiques quotidiennes',
    schedule: '55 23 * * *', // Tous les jours à 23h55
    enabled: true,
    task: async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const stats = await database_1.prisma.feuilleTravail.groupBy({
            by: ['statut'],
            where: {
                createdAt: { gte: today, lt: tomorrow },
            },
            _count: true,
        });
        const heuresTotal = await database_1.prisma.feuilleTravail.aggregate({
            where: {
                dateTravail: { gte: today, lt: tomorrow },
                statut: 'VALIDE',
            },
            _sum: { heuresTotales: true },
        });
        const nouveauxMonteurs = await database_1.prisma.monteur.count({
            where: {
                createdAt: { gte: today, lt: tomorrow },
            },
        });
        if (stats.length > 0 || nouveauxMonteurs > 0) {
            logger_1.logger.info(`[CRON] === Statistiques du jour ===`);
            logger_1.logger.info(`[CRON] Feuilles créées: ${stats.reduce((acc, s) => acc + s._count, 0)}`);
            stats.forEach((s) => {
                logger_1.logger.info(`[CRON]   - ${s.statut}: ${s._count}`);
            });
            logger_1.logger.info(`[CRON] Heures validées: ${heuresTotal._sum.heuresTotales || 0}h`);
            logger_1.logger.info(`[CRON] Nouveaux monteurs: ${nouveauxMonteurs}`);
        }
    },
});
// =====================================================
// JOB 5: Rapport hebdomadaire
// Exécution: Tous les lundis à 8h00
// =====================================================
registerJob({
    name: 'Rapport hebdomadaire',
    schedule: '0 8 * * 1', // Tous les lundis à 8h00
    enabled: true,
    task: async () => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const feuillesValidees = await database_1.prisma.feuilleTravail.count({
            where: {
                statut: 'VALIDE',
                updatedAt: { gte: oneWeekAgo },
            },
        });
        const feuillesRejetees = await database_1.prisma.feuilleTravail.count({
            where: {
                statut: 'REJETE',
                updatedAt: { gte: oneWeekAgo },
            },
        });
        const heuresTotal = await database_1.prisma.feuilleTravail.aggregate({
            where: {
                statut: 'VALIDE',
                dateTravail: { gte: oneWeekAgo },
            },
            _sum: { heuresTotales: true },
        });
        const fraisTotal = await database_1.prisma.frais.aggregate({
            where: {
                feuille: {
                    statut: 'VALIDE',
                    dateTravail: { gte: oneWeekAgo },
                },
            },
            _sum: { montant: true },
        });
        const topMonteurs = await database_1.prisma.feuilleTravail.groupBy({
            by: ['monteurId'],
            where: {
                statut: 'VALIDE',
                dateTravail: { gte: oneWeekAgo },
            },
            _sum: { heuresTotales: true },
            orderBy: { _sum: { heuresTotales: 'desc' } },
            take: 5,
        });
        if (feuillesValidees > 0 || feuillesRejetees > 0) {
            logger_1.logger.info(`[CRON] === Rapport Hebdomadaire ===`);
            logger_1.logger.info(`[CRON] Période: ${oneWeekAgo.toLocaleDateString('fr-FR')} - ${new Date().toLocaleDateString('fr-FR')}`);
            logger_1.logger.info(`[CRON] Feuilles validées: ${feuillesValidees}`);
            logger_1.logger.info(`[CRON] Feuilles rejetées: ${feuillesRejetees}`);
            logger_1.logger.info(`[CRON] Heures totales: ${heuresTotal._sum.heuresTotales || 0}h`);
            logger_1.logger.info(`[CRON] Frais totaux: ${(fraisTotal._sum.montant || 0).toFixed(2)} EUR`);
            logger_1.logger.info(`[CRON] Top ${topMonteurs.length} monteurs cette semaine`);
        }
    },
});
// =====================================================
// Utilitaires
// =====================================================
/**
 * Lister tous les jobs enregistrés
 */
const listJobs = () => {
    return jobs.map((job) => ({
        name: job.name,
        schedule: job.schedule,
        enabled: job.enabled,
    }));
};
exports.listJobs = listJobs;
/**
 * Activer/Désactiver un job
 */
const toggleJob = (name, enabled) => {
    const job = jobs.find((j) => j.name === name);
    if (job) {
        job.enabled = enabled;
        logger_1.logger.info(`[CRON] Job "${name}" ${enabled ? 'activé' : 'désactivé'}`);
        return true;
    }
    return false;
};
exports.toggleJob = toggleJob;
/**
 * Exécuter un job manuellement
 */
const runJobManually = async (name) => {
    const job = jobs.find((j) => j.name === name);
    if (job) {
        logger_1.logger.info(`[CRON] Exécution manuelle: ${name}`);
        try {
            await job.task();
            return true;
        }
        catch (error) {
            logger_1.logger.error(`[CRON] Erreur exécution manuelle ${name}:`, error);
            return true; // On retourne true car le job a été trouvé et tenté
        }
    }
    return false;
};
exports.runJobManually = runJobManually;
/**
 * Réinitialiser l'état des jobs (pour les tests)
 */
const resetJobsState = () => {
    jobs.forEach((j) => {
        j.enabled = true;
    });
};
exports.resetJobsState = resetJobsState;
exports.default = {
    startCronJobs: exports.startCronJobs,
    listJobs: exports.listJobs,
    toggleJob: exports.toggleJob,
    runJobManually: exports.runJobManually,
};
//# sourceMappingURL=cronService.js.map