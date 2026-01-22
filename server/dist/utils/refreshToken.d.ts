/**
 * Génère un nouveau refresh token pour un utilisateur
 */
export declare const generateRefreshToken: (userId: string) => Promise<string>;
/**
 * Valide un refresh token et retourne l'utilisateur associé
 */
export declare const validateRefreshToken: (token: string) => Promise<{
    email: string;
    id: string;
    createdAt: Date;
    password: string;
    role: import(".prisma/client").$Enums.Role;
    monteurId: string | null;
    updatedAt: Date;
}>;
/**
 * Révoque un refresh token spécifique
 */
export declare const revokeRefreshToken: (token: string) => Promise<void>;
/**
 * Révoque tous les refresh tokens d'un utilisateur
 */
export declare const revokeAllUserRefreshTokens: (userId: string) => Promise<void>;
/**
 * Nettoie les refresh tokens expirés (à exécuter périodiquement)
 */
export declare const cleanExpiredRefreshTokens: () => Promise<number>;
/**
 * Obtient tous les refresh tokens actifs d'un utilisateur
 */
export declare const getUserRefreshTokens: (userId: string) => Promise<{
    id: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    userId: string;
}[]>;
//# sourceMappingURL=refreshToken.d.ts.map