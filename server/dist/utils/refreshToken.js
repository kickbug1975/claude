"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserRefreshTokens = exports.cleanExpiredRefreshTokens = exports.revokeAllUserRefreshTokens = exports.revokeRefreshToken = exports.validateRefreshToken = exports.generateRefreshToken = void 0;
const crypto_1 = require("crypto");
const database_1 = require("../config/database");
// Durée de validité du refresh token: 7 jours
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
/**
 * Génère un nouveau refresh token pour un utilisateur
 */
const generateRefreshToken = async (userId) => {
    // Générer un token aléatoire sécurisé
    const token = (0, crypto_1.randomBytes)(64).toString('hex');
    // Calculer la date d'expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    // Sauvegarder le token dans la base de données
    await database_1.prisma.refreshToken.create({
        data: {
            token,
            userId,
            expiresAt,
        },
    });
    return token;
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Valide un refresh token et retourne l'utilisateur associé
 */
const validateRefreshToken = async (token) => {
    // Chercher le token dans la base de données
    const refreshToken = await database_1.prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
    });
    if (!refreshToken) {
        throw new Error('Token de rafraîchissement invalide');
    }
    // Vérifier si le token a expiré
    if (refreshToken.expiresAt < new Date()) {
        // Supprimer le token expiré
        await database_1.prisma.refreshToken.delete({
            where: { id: refreshToken.id },
        });
        throw new Error('Token de rafraîchissement expiré');
    }
    return refreshToken.user;
};
exports.validateRefreshToken = validateRefreshToken;
/**
 * Révoque un refresh token spécifique
 */
const revokeRefreshToken = async (token) => {
    await database_1.prisma.refreshToken.deleteMany({
        where: { token },
    });
};
exports.revokeRefreshToken = revokeRefreshToken;
/**
 * Révoque tous les refresh tokens d'un utilisateur
 */
const revokeAllUserRefreshTokens = async (userId) => {
    await database_1.prisma.refreshToken.deleteMany({
        where: { userId },
    });
};
exports.revokeAllUserRefreshTokens = revokeAllUserRefreshTokens;
/**
 * Nettoie les refresh tokens expirés (à exécuter périodiquement)
 */
const cleanExpiredRefreshTokens = async () => {
    const result = await database_1.prisma.refreshToken.deleteMany({
        where: {
            expiresAt: {
                lt: new Date(),
            },
        },
    });
    return result.count;
};
exports.cleanExpiredRefreshTokens = cleanExpiredRefreshTokens;
/**
 * Obtient tous les refresh tokens actifs d'un utilisateur
 */
const getUserRefreshTokens = async (userId) => {
    return await database_1.prisma.refreshToken.findMany({
        where: {
            userId,
            expiresAt: {
                gt: new Date(),
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
};
exports.getUserRefreshTokens = getUserRefreshTokens;
//# sourceMappingURL=refreshToken.js.map