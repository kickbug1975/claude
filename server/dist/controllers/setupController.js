"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeSetup = exports.importData = exports.uploadLogos = exports.updateCompanyInfo = exports.createInitialAdmin = exports.getSetupStatus = void 0;
const database_1 = require("../config/database");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const s3Service_1 = require("../services/s3Service");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("../utils/jwt");
const refreshToken_1 = require("../utils/refreshToken");
const companySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nom requis'),
    siret: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    email: zod_1.z.string().email('Email invalide').optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
});
const importSchema = zod_1.z.object({
    monteurs: zod_1.z.array(zod_1.z.object({
        nom: zod_1.z.string(),
        prenom: zod_1.z.string(),
        telephone: zod_1.z.string(),
        email: zod_1.z.string().email(),
        adresse: zod_1.z.string(),
        dateEmbauche: zod_1.z.string(),
        numeroIdentification: zod_1.z.string(),
    })).optional(),
    chantiers: zod_1.z.array(zod_1.z.object({
        nom: zod_1.z.string(),
        adresse: zod_1.z.string(),
        client: zod_1.z.string(),
        reference: zod_1.z.string(),
        dateDebut: zod_1.z.string(),
        dateFin: zod_1.z.string().optional(),
        description: zod_1.z.string(),
    })).optional(),
});
const getSetupStatus = async (_req, res) => {
    try {
        const company = await database_1.prisma.company.findFirst({
            where: { active: true },
        });
        const [monteurCount, chantierCount, adminUser] = await Promise.all([
            database_1.prisma.monteur.count(),
            database_1.prisma.chantier.count(),
            database_1.prisma.user.findFirst({ where: { role: 'ADMIN' } })
        ]);
        return res.status(200).json({
            success: true,
            data: {
                isSetupComplete: company?.isSetupComplete || false,
                hasAdmin: !!adminUser,
                company: company || null,
                counts: {
                    monteurs: monteurCount,
                    chantiers: chantierCount,
                }
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur getSetupStatus detail:', error instanceof Error ? error : error);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors du chargement de la configuration' });
    }
};
exports.getSetupStatus = getSetupStatus;
const createInitialAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
        }
        // Vérifier si un admin existe déjà
        const existingAdmin = await database_1.prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (existingAdmin) {
            return res.status(403).json({ success: false, message: 'Un administrateur existe déjà' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await database_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'ADMIN',
            }
        });
        logger_1.logger.info(`Nouvel administrateur créé : ${email}`);
        // On connecte directement l'utilisateur
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        const refreshToken = await (0, refreshToken_1.generateRefreshToken)(user.id);
        return res.status(201).json({
            success: true,
            message: 'Compte administrateur créé avec succès',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
                token,
                refreshToken
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur createInitialAdmin detail:', error instanceof Error ? error : error);
        return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};
exports.createInitialAdmin = createInitialAdmin;
const updateCompanyInfo = async (req, res) => {
    try {
        const validation = companySchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        let company = await database_1.prisma.company.findFirst({ where: { active: true } });
        if (company) {
            company = await database_1.prisma.company.update({
                where: { id: company.id },
                data: validation.data,
            });
        }
        else {
            company = await database_1.prisma.company.create({
                data: {
                    ...validation.data,
                    isSetupComplete: false,
                },
            });
        }
        // Note: In single-tenant mode, no need to link user to company
        return res.status(200).json({
            success: true,
            message: 'Informations entreprise mises à jour',
            data: company,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur updateCompanyInfo detail:', error instanceof Error ? error : error);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la mise à jour de l\'entreprise' });
    }
};
exports.updateCompanyInfo = updateCompanyInfo;
const uploadLogos = async (req, res) => {
    try {
        if (!req.files) {
            return res.status(400).json({ success: false, message: 'Aucun fichier reçu' });
        }
        const files = req.files;
        const company = await database_1.prisma.company.findFirst({ where: { active: true } });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
        }
        const updates = {};
        if (files.companyLogo && files.companyLogo.length > 0) {
            const file = files.companyLogo[0];
            try {
                const uploaded = await s3Service_1.storageService.upload({
                    buffer: file.buffer,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                }, 'branding');
                updates.companyLogoUrl = uploaded.url;
            }
            catch (err) {
                logger_1.logger.error('Erreur upload companyLogo', err);
            }
        }
        if (files.loginLogo && files.loginLogo.length > 0) {
            const file = files.loginLogo[0];
            try {
                const uploaded = await s3Service_1.storageService.upload({
                    buffer: file.buffer,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                }, 'branding');
                updates.loginLogoUrl = uploaded.url;
            }
            catch (err) {
                logger_1.logger.error('Erreur upload loginLogo', err);
            }
        }
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'Aucun logo valide configuré' });
        }
        const updatedCompany = await database_1.prisma.company.update({
            where: { id: company.id },
            data: updates,
        });
        return res.status(200).json({
            success: true,
            data: updatedCompany,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur uploadLogos critique', error instanceof Error ? error : undefined);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de l\'upload des logos' });
    }
};
exports.uploadLogos = uploadLogos;
const importData = async (req, res) => {
    try {
        const validation = importSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ success: false, message: 'Données d\'import invalides' });
        }
        const company = await database_1.prisma.company.findFirst({ where: { active: true } });
        if (!company) {
            return res.status(400).json({ success: false, message: 'Configurez d\'abord l\'entreprise' });
        }
        const { monteurs, chantiers } = validation.data;
        let importedMonteurs = 0;
        let importedChantiers = 0;
        if (monteurs && monteurs.length > 0) {
            const result = await database_1.prisma.monteur.createMany({
                data: monteurs.map(m => ({
                    ...m,
                    dateEmbauche: new Date(m.dateEmbauche),
                })),
                skipDuplicates: true,
            });
            importedMonteurs = result.count;
        }
        if (chantiers && chantiers.length > 0) {
            const result = await database_1.prisma.chantier.createMany({
                data: chantiers.map(c => ({
                    ...c,
                    dateDebut: new Date(c.dateDebut),
                    dateFin: c.dateFin ? new Date(c.dateFin) : null,
                })),
                skipDuplicates: true,
            });
            importedChantiers = result.count;
        }
        return res.status(200).json({
            success: true,
            message: 'Données traitées avec succès',
            data: {
                importedMonteurs,
                importedChantiers
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur importData detail:', error instanceof Error ? error : error);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de l\'importation des données' });
    }
};
exports.importData = importData;
const finalizeSetup = async (_req, res) => {
    try {
        const company = await database_1.prisma.company.findFirst({ where: { active: true } });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
        }
        await database_1.prisma.company.update({
            where: { id: company.id },
            data: { isSetupComplete: true },
        });
        return res.status(200).json({
            success: true,
            message: 'Configuration terminée',
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur finalizeSetup detail:', error instanceof Error ? error : error);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la finalisation' });
    }
};
exports.finalizeSetup = finalizeSetup;
//# sourceMappingURL=setupController.js.map