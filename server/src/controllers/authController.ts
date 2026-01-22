import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { generateToken } from '../utils/jwt';
import { generateRefreshToken, validateRefreshToken, revokeRefreshToken, revokeAllUserRefreshTokens } from '../utils/refreshToken';
import { z } from 'zod';
import { logger } from '../utils/logger';

const loginSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
});

const registerSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    role: z.enum(['ADMIN', 'SUPERVISEUR', 'MONTEUR']).optional(),
});

const forgotPasswordSchema = z.object({
    email: z.string().email('Email invalide'),
});

const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token requis'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, 'Ancien mot de passe requis'),
    newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
});

export const login = async (req: Request, res: Response) => {
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

        const user = await prisma.user.findUnique({
            where: { email },
            include: { monteur: true },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect',
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect',
            });
        }

        // Générer le token JWT (courte durée)
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Générer le refresh token (longue durée)
        const refreshToken = await generateRefreshToken(user.id);

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
    } catch (error) {
        logger.error('Erreur login', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};

export const register = async (req: Request, res: Response) => {
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

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Cet email est déjà utilisé',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: role || 'MONTEUR',
                name: email.split('@')[0], // Provide default name as required by schema
            },
        });

        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        const refreshToken = await generateRefreshToken(user.id);

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
    } catch (error) {
        logger.error('Erreur register', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};

export const me = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Non authentifié',
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: Number(req.user.userId) }, // Cast to Number
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
    } catch (error) {
        logger.error('Erreur me', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};

export const refresh = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token requis',
            });
        }

        const user = await validateRefreshToken(refreshToken);

        const newToken = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        const newRefreshToken = await generateRefreshToken(user.id);
        await revokeRefreshToken(refreshToken);

        return res.status(200).json({
            success: true,
            message: 'Token rafraîchi avec succès',
            data: {
                token: newToken,
                refreshToken: newRefreshToken,
            },
        });
    } catch (error: any) {
        logger.error('Erreur refresh', error);
        return res.status(401).json({
            success: false,
            message: error.message || 'Token de rafraîchissement invalide',
        });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            await revokeRefreshToken(refreshToken);
        }

        return res.status(200).json({
            success: true,
            message: 'Déconnexion réussie',
        });
    } catch (error) {
        logger.error('Erreur logout', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};

export const logoutAll = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Non authentifié',
            });
        }

        await revokeAllUserRefreshTokens(Number(req.user.userId));

        return res.status(200).json({
            success: true,
            message: 'Déconnexion de tous les appareils réussie',
        });
    } catch (error) {
        logger.error('Erreur logoutAll', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    // Placeholder skeleton as emailService is not yet confirmed/restored
    // Logic from dist used EmailService which might be missing.
    // For now, return success to avoid crashing, or implement if emailService is restored.
    // Given the urgency of LOGGING IN, we can keep this minimal or stubbed.
    // BUT, the dist code imported emailService.
    return res.status(501).json({
        success: false,
        message: 'Non implémenté (EmailService manquant)',
    });
};

export const resetPassword = async (req: Request, res: Response) => {
    // Placeholder skeleton
    return res.status(501).json({
        success: false,
        message: 'Non implémenté',
    });
};

export const changePassword = async (req: Request, res: Response) => {
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

        const user = await prisma.user.findUnique({
            where: { id: Number(req.user.userId) }, // Cast to Number
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé',
            });
        }

        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Ancien mot de passe incorrect',
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        return res.status(200).json({
            success: true,
            message: 'Mot de passe modifié avec succès',
        });
    } catch (error) {
        logger.error('Erreur changePassword', error instanceof Error ? error : undefined);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
};
