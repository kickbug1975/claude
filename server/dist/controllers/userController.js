"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
const database_1 = require("../config/database");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email invalide'),
    password: zod_1.z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    role: zod_1.z.enum(['ADMIN', 'SUPERVISEUR', 'MONTEUR']),
    monteurId: zod_1.z.string().uuid().optional().nullable(),
});
const updateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email invalide').optional(),
    role: zod_1.z.enum(['ADMIN', 'SUPERVISEUR', 'MONTEUR']).optional(),
    monteurId: zod_1.z.string().uuid().optional().nullable(),
    password: zod_1.z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').optional(),
});
/**
 * Liste tous les utilisateurs
 */
const getAllUsers = async (_req, res) => {
    try {
        const users = await database_1.prisma.user.findMany({
            where: {},
            include: {
                monteur: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        const safeUsers = users.map((user) => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        return res.status(200).json({
            success: true,
            data: safeUsers,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur getAllUsers', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.getAllUsers = getAllUsers;
/**
 * Récupère un utilisateur par son ID
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await database_1.prisma.user.findUnique({
            where: {
                id
            },
            include: {
                monteur: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé',
            });
        }
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json({
            success: true,
            data: userWithoutPassword,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur getUserById', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.getUserById = getUserById;
/**
 * Crée un nouvel utilisateur
 */
const createUser = async (req, res) => {
    try {
        const validation = createUserSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const { email, password, role, monteurId } = validation.data;
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Cet email est déjà utilisé',
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await database_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role,
                monteurId,
            },
        });
        const { password: _, ...userWithoutPassword } = user;
        return res.status(201).json({
            success: true,
            message: 'Utilisateur créé avec succès',
            data: userWithoutPassword,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur createUser', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.createUser = createUser;
/**
 * Met à jour un utilisateur
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const validation = updateUserSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const updateData = { ...validation.data };
        if (updateData.password) {
            updateData.password = await bcryptjs_1.default.hash(updateData.password, 10);
        }
        const existingUser = await database_1.prisma.user.findUnique({
            where: { id }
        });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé',
            });
        }
        const user = await database_1.prisma.user.update({
            where: { id },
            data: updateData,
        });
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json({
            success: true,
            message: 'Utilisateur mis à jour avec succès',
            data: userWithoutPassword,
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur updateUser', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.updateUser = updateUser;
/**
 * Supprime un utilisateur
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Empêcher la suppression de son propre compte (optionnel)
        if (id === req.user?.userId) {
            return res.status(400).json({
                success: false,
                message: 'Vous ne pouvez pas supprimer votre propre compte',
            });
        }
        const existingUser = await database_1.prisma.user.findUnique({
            where: { id }
        });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé',
            });
        }
        await database_1.prisma.user.delete({
            where: { id },
        });
        return res.status(200).json({
            success: true,
            message: 'Utilisateur supprimé avec succès',
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur deleteUser', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=userController.js.map