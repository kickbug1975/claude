import { randomBytes } from 'crypto';
import { prisma } from '../config/prisma';

// Durée de validité du refresh token: 7 jours
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/**
 * Génère un nouveau refresh token pour un utilisateur
 */
export const generateRefreshToken = async (userId: string): Promise<string> => {
    // Générer un token aléatoire sécurisé
    const token = randomBytes(64).toString('hex');

    // Calculer la date d'expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    // Sauvegarder le token dans la base de données
    await prisma.maintenanceRefreshToken.create({
        data: {
            token,
            maintenanceUserId: userId,
            expiresAt,
        },
    });

    return token;
};

/**
 * Valide un refresh token et retourne l'utilisateur associé
 */
export const validateRefreshToken = async (token: string) => {
    // Chercher le token dans la base de données
    const refreshToken = await prisma.maintenanceRefreshToken.findUnique({
        where: { token },
        include: { maintenanceUser: true },
    });

    if (!refreshToken) {
        throw new Error('Token de rafraîchissement invalide');
    }

    // Vérifier si le token a expiré
    if (refreshToken.expiresAt < new Date()) {
        // Supprimer le token expiré
        await prisma.maintenanceRefreshToken.delete({
            where: { id: refreshToken.id },
        });
        throw new Error('Token de rafraîchissement expiré');
    }

    return refreshToken.maintenanceUser;
};

/**
 * Révoque un refresh token spécifique
 */
export const revokeRefreshToken = async (token: string): Promise<void> => {
    await prisma.maintenanceRefreshToken.deleteMany({
        where: { token },
    });
};

/**
 * Révoque tous les refresh tokens d'un utilisateur
 */
export const revokeAllUserRefreshTokens = async (userId: string): Promise<void> => {
    await prisma.maintenanceRefreshToken.deleteMany({
        where: { maintenanceUserId: userId },
    });
};

/**
 * Nettoie les refresh tokens expirés (à exécuter périodiquement)
 */
export const cleanExpiredRefreshTokens = async (): Promise<number> => {
    const result = await prisma.maintenanceRefreshToken.deleteMany({
        where: {
            expiresAt: {
                lt: new Date(),
            },
        },
    });
    return result.count;
};

/**
 * Obtient tous les refresh tokens actifs d'un utilisateur
 */
export const getUserRefreshTokens = async (userId: string) => {
    return await prisma.maintenanceRefreshToken.findMany({
        where: {
            maintenanceUserId: userId,
            expiresAt: {
                gt: new Date(),
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
};
