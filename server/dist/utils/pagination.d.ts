/**
 * Utilitaires de pagination pour les réponses API
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}
export interface PaginationParams {
    page?: string | number;
    limit?: string | number;
}
/**
 * Extrait et valide les paramètres de pagination depuis la query string
 * @param query - Query parameters de la requête
 * @returns Paramètres de pagination validés et calculés
 */
export declare const getPaginationParams: (query: PaginationParams) => {
    page: number;
    limit: number;
    skip: number;
};
/**
 * Construit une réponse paginée standardisée
 * @param data - Données de la page actuelle
 * @param total - Nombre total d'éléments
 * @param page - Numéro de page actuel
 * @param pageSize - Taille de la page
 * @returns Réponse paginée formatée
 */
export declare const buildPaginatedResponse: <T>(data: T[], total: number, page: number, pageSize: number) => PaginatedResponse<T>;
//# sourceMappingURL=pagination.d.ts.map