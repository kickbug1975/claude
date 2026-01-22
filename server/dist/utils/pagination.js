"use strict";
/**
 * Utilitaires de pagination pour les réponses API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaginatedResponse = exports.getPaginationParams = void 0;
/**
 * Extrait et valide les paramètres de pagination depuis la query string
 * @param query - Query parameters de la requête
 * @returns Paramètres de pagination validés et calculés
 */
const getPaginationParams = (query) => {
    const page = Math.max(1, parseInt(String(query.page || 1)) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 10)) || 10));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
exports.getPaginationParams = getPaginationParams;
/**
 * Construit une réponse paginée standardisée
 * @param data - Données de la page actuelle
 * @param total - Nombre total d'éléments
 * @param page - Numéro de page actuel
 * @param pageSize - Taille de la page
 * @returns Réponse paginée formatée
 */
const buildPaginatedResponse = (data, total, page, pageSize) => {
    return {
        data,
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
        },
    };
};
exports.buildPaginatedResponse = buildPaginatedResponse;
//# sourceMappingURL=pagination.js.map