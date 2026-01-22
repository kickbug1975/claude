"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStorageInfo = exports.attachFileToFeuille = exports.deleteFile = exports.getFileById = exports.getFilesByFeuille = exports.uploadFiles = void 0;
const database_1 = require("../config/database");
const s3Service_1 = require("../services/s3Service");
const logger_1 = require("../utils/logger");
/**
 * Upload un ou plusieurs fichiers
 */
const uploadFiles = async (req, res) => {
    try {
        const files = req.files;
        const { feuilleId, description } = req.body;
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier fourni',
            });
        }
        // Vérifier que la feuille existe si feuilleId est fourni
        if (feuilleId) {
            const feuille = await database_1.prisma.feuilleTravail.findUnique({
                where: { id: feuilleId },
            });
            if (!feuille) {
                return res.status(404).json({
                    success: false,
                    message: 'Feuille de travail non trouvée',
                });
            }
        }
        // Upload des fichiers
        const uploadedFiles = await s3Service_1.storageService.uploadMultiple(files.map((f) => ({
            buffer: f.buffer,
            originalname: f.originalname,
            mimetype: f.mimetype,
            size: f.size,
        })), feuilleId ? `feuilles/${feuilleId}` : 'documents');
        // Enregistrer les fichiers en base de données
        const fichiers = await Promise.all(uploadedFiles.map((file) => database_1.prisma.fichier.create({
            data: {
                nom: file.originalName,
                cle: file.key,
                url: file.url,
                mimeType: file.mimeType,
                taille: file.size,
                description: description || null,
                feuilleId: feuilleId || null,
            },
        })));
        logger_1.logger.info(`${fichiers.length} fichier(s) uploadé(s) avec succès`);
        return res.status(201).json({
            success: true,
            message: `${fichiers.length} fichier(s) uploadé(s) avec succès`,
            data: fichiers,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur upload fichiers:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'upload des fichiers',
        });
    }
};
exports.uploadFiles = uploadFiles;
/**
 * Récupérer les fichiers d'une feuille de travail
 */
const getFilesByFeuille = async (req, res) => {
    try {
        const { feuilleId } = req.params;
        // Verify access to the feuille first
        const feuille = await database_1.prisma.feuilleTravail.findUnique({
            where: { id: feuilleId }
        });
        if (!feuille) {
            return res.status(404).json({
                success: false,
                message: 'Feuille de travail non trouvée',
            });
        }
        const fichiers = await database_1.prisma.fichier.findMany({
            where: { feuilleId },
            orderBy: { createdAt: 'desc' },
        });
        // Générer des URLs signées si S3 est configuré
        const fichiersAvecUrls = fichiers.map((f) => ({
            ...f,
            downloadUrl: s3Service_1.storageService.getUrl(f.cle),
        }));
        return res.status(200).json({
            success: true,
            data: fichiersAvecUrls,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur récupération fichiers:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des fichiers',
        });
    }
};
exports.getFilesByFeuille = getFilesByFeuille;
/**
 * Récupérer un fichier par son ID
 */
const getFileById = async (req, res) => {
    try {
        const { id } = req.params;
        const fichier = await database_1.prisma.fichier.findUnique({
            where: { id },
            include: { feuille: true }
        });
        if (!fichier) {
            return res.status(404).json({
                success: false,
                message: 'Fichier non trouvé',
            });
        }
        return res.status(200).json({
            success: true,
            data: {
                ...fichier,
                downloadUrl: s3Service_1.storageService.getUrl(fichier.cle),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur récupération fichier:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du fichier',
        });
    }
};
exports.getFileById = getFileById;
/**
 * Supprimer un fichier
 */
const deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        const fichier = await database_1.prisma.fichier.findUnique({
            where: { id },
            include: { feuille: true }
        });
        if (!fichier) {
            return res.status(404).json({
                success: false,
                message: 'Fichier non trouvé',
            });
        }
        // Supprimer du stockage (S3 ou local)
        await s3Service_1.storageService.delete(fichier.cle);
        // Supprimer de la base de données
        await database_1.prisma.fichier.delete({
            where: { id },
        });
        logger_1.logger.info(`Fichier supprimé: ${fichier.nom}`);
        return res.status(200).json({
            success: true,
            message: 'Fichier supprimé avec succès',
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur suppression fichier:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du fichier',
        });
    }
};
exports.deleteFile = deleteFile;
/**
 * Attacher un fichier existant à une feuille de travail
 */
const attachFileToFeuille = async (req, res) => {
    try {
        const { id } = req.params;
        const { feuilleId } = req.body;
        // Vérifier que le fichier existe et appartient à l'entreprise (s'il est lié)
        const fichier = await database_1.prisma.fichier.findUnique({
            where: { id },
            include: { feuille: true }
        });
        if (!fichier) {
            return res.status(404).json({
                success: false,
                message: 'Fichier non trouvé',
            });
        }
        // Vérifier que la feuille existe
        const feuille = await database_1.prisma.feuilleTravail.findUnique({
            where: { id: feuilleId },
        });
        if (!feuille) {
            return res.status(404).json({
                success: false,
                message: 'Feuille de travail non trouvée',
            });
        }
        // Mettre à jour le fichier
        const fichierMisAJour = await database_1.prisma.fichier.update({
            where: { id },
            data: { feuilleId },
        });
        return res.status(200).json({
            success: true,
            message: 'Fichier attaché à la feuille avec succès',
            data: fichierMisAJour,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur attachement fichier:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'attachement du fichier',
        });
    }
};
exports.attachFileToFeuille = attachFileToFeuille;
/**
 * Obtenir les informations de configuration du stockage
 */
const getStorageInfo = async (_req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            storageType: (0, s3Service_1.isS3Configured)() ? 'S3' : 'local',
            configured: (0, s3Service_1.isS3Configured)(),
        },
    });
};
exports.getStorageInfo = getStorageInfo;
//# sourceMappingURL=fichierController.js.map