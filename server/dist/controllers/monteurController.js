"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonteurStats = exports.deleteMonteur = exports.updateMonteur = exports.createMonteur = exports.getMonteurById = exports.getAllMonteurs = void 0;
const database_1 = require("../config/database");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const pagination_1 = require("../utils/pagination");
const monteurSchema = zod_1.z.object({
    nom: zod_1.z.string().min(1, 'Nom requis'),
    prenom: zod_1.z.string().min(1, 'Prénom requis'),
    telephone: zod_1.z.string().min(1, 'Téléphone requis'),
    email: zod_1.z.string().email('Email invalide'),
    adresse: zod_1.z.string().min(1, 'Adresse requise'),
    dateEmbauche: zod_1.z.string().transform((val) => new Date(val)),
    numeroIdentification: zod_1.z.string().min(1, 'Numéro d\'identification requis'),
    actif: zod_1.z.boolean().optional().default(true),
});
const getAllMonteurs = async (req, res) => {
    try {
        const { actif } = req.query;
        const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req.query);
        const where = {};
        if (actif !== undefined)
            where.actif = actif === 'true';
        // Compter le total avec le même where
        const total = await database_1.prisma.monteur.count({ where });
        // Récupérer les monteurs paginés
        const monteurs = await database_1.prisma.monteur.findMany({
            where,
            orderBy: { nom: 'asc' },
            skip,
            take: limit,
            include: {
                user: {
                    select: { id: true, email: true, role: true },
                },
            },
        });
        // Construire la réponse paginée
        const response = (0, pagination_1.buildPaginatedResponse)(monteurs, total, page, limit);
        return res.status(200).json({
            success: true,
            ...response,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur getAllMonteurs', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.getAllMonteurs = getAllMonteurs;
const getMonteurById = async (req, res) => {
    try {
        const { id } = req.params;
        const monteur = await database_1.prisma.monteur.findUnique({
            where: {
                id
            },
            include: {
                user: {
                    select: { id: true, email: true, role: true },
                },
                feuillesTravail: {
                    take: 10,
                    orderBy: { dateTravail: 'desc' },
                    include: {
                        chantier: { select: { nom: true, reference: true } },
                    },
                },
            },
        });
        if (!monteur) {
            return res.status(404).json({
                success: false,
                message: 'Monteur non trouvé',
            });
        }
        return res.status(200).json({
            success: true,
            data: monteur,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur getMonteurById', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.getMonteurById = getMonteurById;
const createMonteur = async (req, res) => {
    try {
        logger_1.logger.info('Tentative de création de monteur:', req.body);
        const validation = monteurSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const data = validation.data;
        // Vérifier si l'email existe déjà
        const existingEmail = await database_1.prisma.monteur.findUnique({
            where: { email: data.email },
        });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: 'Cet email est déjà utilisé',
            });
        }
        // Vérifier si le numéro d'identification existe déjà
        const existingNumero = await database_1.prisma.monteur.findUnique({
            where: { numeroIdentification: data.numeroIdentification },
        });
        if (existingNumero) {
            return res.status(409).json({
                success: false,
                message: 'Ce numéro d\'identification est déjà utilisé',
            });
        }
        const monteur = await database_1.prisma.monteur.create({
            data: data,
        });
        return res.status(201).json({
            success: true,
            message: 'Monteur créé avec succès',
            data: monteur,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur createMonteur', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.createMonteur = createMonteur;
const updateMonteur = async (req, res) => {
    try {
        const { id } = req.params;
        const validation = monteurSchema.partial().safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const existingMonteur = await database_1.prisma.monteur.findUnique({
            where: {
                id
            },
        });
        if (!existingMonteur) {
            return res.status(404).json({
                success: false,
                message: 'Monteur non trouvé',
            });
        }
        const monteur = await database_1.prisma.monteur.update({
            where: { id },
            data: validation.data,
        });
        return res.status(200).json({
            success: true,
            message: 'Monteur mis à jour avec succès',
            data: monteur,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur updateMonteur', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.updateMonteur = updateMonteur;
const deleteMonteur = async (req, res) => {
    try {
        const { id } = req.params;
        const existingMonteur = await database_1.prisma.monteur.findUnique({
            where: {
                id
            },
        });
        if (!existingMonteur) {
            return res.status(404).json({
                success: false,
                message: 'Monteur non trouvé',
            });
        }
        await database_1.prisma.monteur.delete({
            where: { id },
        });
        return res.status(200).json({
            success: true,
            message: 'Monteur supprimé avec succès',
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur deleteMonteur', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.deleteMonteur = deleteMonteur;
const getMonteurStats = async (req, res) => {
    try {
        const { id } = req.params;
        const { mois, annee } = req.query;
        const year = annee ? parseInt(annee) : new Date().getFullYear();
        const month = mois ? parseInt(mois) : new Date().getMonth() + 1;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const stats = await database_1.prisma.feuilleTravail.aggregate({
            where: {
                monteurId: id,
                dateTravail: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: { heuresTotales: true },
            _count: true,
        });
        const fraisTotal = await database_1.prisma.frais.aggregate({
            where: {
                feuille: {
                    monteurId: id,
                    dateTravail: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            },
            _sum: { montant: true },
        });
        return res.status(200).json({
            success: true,
            data: {
                periode: { mois: month, annee: year },
                heuresTotal: stats._sum.heuresTotales || 0,
                nombreFeuilles: stats._count,
                fraisTotal: fraisTotal._sum.montant || 0,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur getMonteurStats', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.getMonteurStats = getMonteurStats;
//# sourceMappingURL=monteurController.js.map