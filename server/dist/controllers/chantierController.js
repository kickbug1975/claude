"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChantierStats = exports.deleteChantier = exports.updateChantier = exports.createChantier = exports.getChantierById = exports.getAllChantiers = void 0;
const database_1 = require("../config/database");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const pagination_1 = require("../utils/pagination");
const chantierSchema = zod_1.z.object({
    nom: zod_1.z.string().min(1, 'Nom requis'),
    adresse: zod_1.z.string().min(1, 'Adresse requise'),
    client: zod_1.z.string().min(1, 'Client requis'),
    reference: zod_1.z.string().min(1, 'Référence requise'),
    dateDebut: zod_1.z.string().transform((val) => new Date(val)),
    dateFin: zod_1.z.string().transform((val) => new Date(val)).optional().nullable(),
    description: zod_1.z.string().min(1, 'Description requise'),
    actif: zod_1.z.boolean().optional().default(true),
});
const getAllChantiers = async (req, res) => {
    try {
        const { actif } = req.query;
        const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req.query);
        const where = {};
        if (actif !== undefined)
            where.actif = actif === 'true';
        // Compter le total avec le même where
        const total = await database_1.prisma.chantier.count({ where });
        // Récupérer les chantiers paginés
        const chantiers = await database_1.prisma.chantier.findMany({
            where,
            orderBy: { dateDebut: 'desc' },
            skip,
            take: limit,
        });
        // Construire la réponse paginée
        const response = (0, pagination_1.buildPaginatedResponse)(chantiers, total, page, limit);
        return res.status(200).json({
            success: true,
            ...response,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur getAllChantiers', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.getAllChantiers = getAllChantiers;
const getChantierById = async (req, res) => {
    try {
        const { id } = req.params;
        const chantier = await database_1.prisma.chantier.findUnique({
            where: {
                id
            },
            include: {
                feuillesTravail: {
                    take: 10,
                    orderBy: { dateTravail: 'desc' },
                    include: {
                        monteur: { select: { nom: true, prenom: true } },
                    },
                },
            },
        });
        if (!chantier) {
            return res.status(404).json({
                success: false,
                message: 'Chantier non trouvé',
            });
        }
        return res.status(200).json({
            success: true,
            data: chantier,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur getChantierById', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.getChantierById = getChantierById;
const createChantier = async (req, res) => {
    try {
        const validation = chantierSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const data = validation.data;
        // Vérifier si la référence existe déjà
        const existingRef = await database_1.prisma.chantier.findUnique({
            where: { reference: data.reference },
        });
        if (existingRef) {
            return res.status(409).json({
                success: false,
                message: 'Cette référence est déjà utilisée',
            });
        }
        const chantier = await database_1.prisma.chantier.create({
            data: data,
        });
        return res.status(201).json({
            success: true,
            message: 'Chantier créé avec succès',
            data: chantier,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur createChantier', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.createChantier = createChantier;
const updateChantier = async (req, res) => {
    try {
        const { id } = req.params;
        const validation = chantierSchema.partial().safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const existingChantier = await database_1.prisma.chantier.findUnique({
            where: {
                id
            },
        });
        if (!existingChantier) {
            return res.status(404).json({
                success: false,
                message: 'Chantier non trouvé',
            });
        }
        const chantier = await database_1.prisma.chantier.update({
            where: { id },
            data: validation.data,
        });
        return res.status(200).json({
            success: true,
            message: 'Chantier mis à jour avec succès',
            data: chantier,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur updateChantier', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.updateChantier = updateChantier;
const deleteChantier = async (req, res) => {
    try {
        const { id } = req.params;
        const existingChantier = await database_1.prisma.chantier.findUnique({
            where: {
                id
            },
        });
        if (!existingChantier) {
            return res.status(404).json({
                success: false,
                message: 'Chantier non trouvé',
            });
        }
        await database_1.prisma.chantier.delete({
            where: { id },
        });
        return res.status(200).json({
            success: true,
            message: 'Chantier supprimé avec succès',
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur deleteChantier', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.deleteChantier = deleteChantier;
const getChantierStats = async (req, res) => {
    try {
        const { id } = req.params;
        const stats = await database_1.prisma.feuilleTravail.aggregate({
            where: { chantierId: id },
            _sum: { heuresTotales: true },
            _count: true,
        });
        const fraisTotal = await database_1.prisma.frais.aggregate({
            where: {
                feuille: { chantierId: id },
            },
            _sum: { montant: true },
        });
        const monteursCount = await database_1.prisma.feuilleTravail.findMany({
            where: { chantierId: id },
            select: { monteurId: true },
            distinct: ['monteurId'],
        });
        return res.status(200).json({
            success: true,
            data: {
                heuresTotal: stats._sum.heuresTotales || 0,
                nombreFeuilles: stats._count,
                fraisTotal: fraisTotal._sum.montant || 0,
                nombreMonteurs: monteursCount.length,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur getChantierStats', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.getChantierStats = getChantierStats;
//# sourceMappingURL=chantierController.js.map