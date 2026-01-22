"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.logoutAll = exports.logout = exports.refresh = exports.me = exports.register = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const jwt_1 = require("../utils/jwt");
const refreshToken_1 = require("../utils/refreshToken");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email invalide'),
    password: zod_1.z.string().min(1, 'Mot de passe requis'),
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email invalide'),
    password: zod_1.z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    role: zod_1.z.enum(['ADMIN', 'SUPERVISEUR', 'MONTEUR']).optional(),
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email invalide'),
});
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token requis'),
    password: zod_1.z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});
const changePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z.string().min(1, 'Ancien mot de passe requis'),
    newPassword: zod_1.z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
});
const login = async (req, res) => {
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const { email, password } = validation.data;
        const user = await database_1.prisma.user.findUnique({
            where: { email },
            include: { monteur: true },
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect',
            });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect',
            });
        }
        // Générer le token JWT (courte durée)
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        // Générer le refresh token (longue durée)
        const refreshToken = await (0, refreshToken_1.generateRefreshToken)(user.id);
        return res.status(200).json({
            success: true,
            message: 'Connexion réussie',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    monteurId: user.monteurId,
                    monteur: user.monteur,
                },
                token,
                refreshToken,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur login', error instanceof Error ? error : undefined, {
            email: req.body.email,
        });
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const { email, password, role } = validation.data;
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
                role: role || 'MONTEUR',
            },
        });
        if (!user) {
            throw new Error('Erreur lors de la création de l\'utilisateur');
        }
        // Générer le token JWT (courte durée)
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        // Générer le refresh token (longue durée)
        const refreshToken = await (0, refreshToken_1.generateRefreshToken)(user.id);
        return res.status(201).json({
            success: true,
            message: 'Inscription réussie',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
                token,
                refreshToken,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur register', error instanceof Error ? error : undefined, {
            email: req.body.email,
        });
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.register = register;
const me = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Non authentifié',
            });
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            include: { monteur: true },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé',
            });
        }
        return res.status(200).json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                role: user.role,
                monteurId: user.monteurId,
                monteur: user.monteur,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur me', error instanceof Error ? error : undefined, {
            userId: req.user?.userId,
        });
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.me = me;
/**
 * Rafraîchit le token JWT en utilisant un refresh token valide
 */
const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token requis',
            });
        }
        // Valider le refresh token
        const user = await (0, refreshToken_1.validateRefreshToken)(refreshToken);
        // Générer un nouveau token JWT
        const newToken = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        // Générer un nouveau refresh token
        const newRefreshToken = await (0, refreshToken_1.generateRefreshToken)(user.id);
        // Révoquer l'ancien refresh token
        await (0, refreshToken_1.revokeRefreshToken)(refreshToken);
        return res.status(200).json({
            success: true,
            message: 'Token rafraîchi avec succès',
            data: {
                token: newToken,
                refreshToken: newRefreshToken,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur refresh', error instanceof Error ? error : undefined);
        return res.status(401).json({
            success: false,
            message: error.message || 'Token de rafraîchissement invalide',
        });
    }
};
exports.refresh = refresh;
/**
 * Déconnecte l'utilisateur en révoquant son refresh token
 */
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await (0, refreshToken_1.revokeRefreshToken)(refreshToken);
        }
        return res.status(200).json({
            success: true,
            message: 'Déconnexion réussie',
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur logout', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.logout = logout;
/**
 * Révoque tous les refresh tokens de l'utilisateur (déconnexion de tous les appareils)
 */
const logoutAll = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Non authentifié',
            });
        }
        await (0, refreshToken_1.revokeAllUserRefreshTokens)(req.user.userId);
        return res.status(200).json({
            success: true,
            message: 'Déconnexion de tous les appareils réussie',
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur logoutAll', error instanceof Error ? error : undefined, {
            userId: req.user?.userId,
        });
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.logoutAll = logoutAll;
/**
 * Demande de réinitialisation de mot de passe
 */
const forgotPassword = async (req, res) => {
    try {
        const validation = forgotPasswordSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const { email } = validation.data;
        const user = await database_1.prisma.user.findUnique({
            where: { email },
        });
        // Pour des raisons de sécurité, on ne dit pas si l'email existe ou non
        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'Si un compte est associé à cet email, un lien de réinitialisation a été envoyé',
            });
        }
        // Supprimer les anciens tokens de réinitialisation pour cet utilisateur
        await database_1.prisma.resetToken.deleteMany({
            where: { userId: user.id },
        });
        // Générer un nouveau token de réinitialisation (valable 1 heure)
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        await database_1.prisma.resetToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt,
            },
        });
        // Envoyer l'email
        const { emailService } = await Promise.resolve().then(() => __importStar(require('../services/emailService')));
        await emailService.sendPasswordReset(user.email, token);
        return res.status(200).json({
            success: true,
            message: 'Si un compte est associé à cet email, un lien de réinitialisation a été envoyé',
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur forgotPassword', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.forgotPassword = forgotPassword;
/**
 * Réinitialisation du mot de passe avec le token
 */
const resetPassword = async (req, res) => {
    try {
        const validation = resetPasswordSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const { token, password } = validation.data;
        const resetToken = await database_1.prisma.resetToken.findUnique({
            where: { token },
            include: { user: true },
        });
        if (!resetToken || resetToken.expiresAt < new Date()) {
            if (resetToken) {
                await database_1.prisma.resetToken.delete({ where: { id: resetToken.id } });
            }
            return res.status(400).json({
                success: false,
                message: 'Le lien de réinitialisation est invalide ou a expiré',
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Mettre à jour le mot de passe et révoquer tous les tokens de l'utilisateur
        await database_1.prisma.$transaction([
            database_1.prisma.user.update({
                where: { id: resetToken.userId },
                data: { password: hashedPassword },
            }),
            database_1.prisma.resetToken.deleteMany({
                where: { userId: resetToken.userId },
            }),
            database_1.prisma.refreshToken.deleteMany({
                where: { userId: resetToken.userId },
            }),
        ]);
        return res.status(200).json({
            success: true,
            message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur resetPassword', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.resetPassword = resetPassword;
/**
 * Changement de mot de passe (utilisateur connecté)
 */
const changePassword = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Non authentifié',
            });
        }
        const validation = changePasswordSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const { oldPassword, newPassword } = validation.data;
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.userId },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé',
            });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Ancien mot de passe incorrect',
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        return res.status(200).json({
            success: true,
            message: 'Mot de passe modifié avec succès',
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur changePassword', error instanceof Error ? error : undefined, {
            userId: req.user?.userId,
        });
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
exports.changePassword = changePassword;
//# sourceMappingURL=authController.js.map