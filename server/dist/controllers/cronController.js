"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeJob = exports.toggleJobStatus = exports.getAllJobs = void 0;
const cronService_1 = require("../services/cronService");
const logger_1 = require("../utils/logger");
/**
 * Lister tous les jobs cron
 */
const getAllJobs = async (_req, res) => {
    try {
        const jobs = (0, cronService_1.listJobs)();
        return res.status(200).json({
            success: true,
            data: jobs,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur liste jobs:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des jobs',
        });
    }
};
exports.getAllJobs = getAllJobs;
/**
 * Activer/Désactiver un job
 */
const toggleJobStatus = async (req, res) => {
    try {
        const { name } = req.params;
        const { enabled } = req.body;
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Le champ "enabled" doit être un booléen',
            });
        }
        const success = (0, cronService_1.toggleJob)(name, enabled);
        if (!success) {
            return res.status(404).json({
                success: false,
                message: `Job "${name}" non trouvé`,
            });
        }
        return res.status(200).json({
            success: true,
            message: `Job "${name}" ${enabled ? 'activé' : 'désactivé'}`,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur toggle job:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la modification du job',
        });
    }
};
exports.toggleJobStatus = toggleJobStatus;
/**
 * Exécuter un job manuellement
 */
const executeJob = async (req, res) => {
    try {
        const { name } = req.params;
        const success = await (0, cronService_1.runJobManually)(name);
        if (!success) {
            return res.status(404).json({
                success: false,
                message: `Job "${name}" non trouvé`,
            });
        }
        return res.status(200).json({
            success: true,
            message: `Job "${name}" exécuté avec succès`,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur exécution job:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'exécution du job',
        });
    }
};
exports.executeJob = executeJob;
//# sourceMappingURL=cronController.js.map