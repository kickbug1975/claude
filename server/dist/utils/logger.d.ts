import winston from 'winston';
declare class Logger {
    private winstonLogger;
    constructor(winstonLogger: winston.Logger);
    /**
     * Log de niveau info
     */
    info(message: string, metadata?: Record<string, any>): void;
    /**
     * Log de niveau warn
     */
    warn(message: string, metadata?: Record<string, any>): void;
    /**
     * Log de niveau error
     */
    error(message: string, error?: Error | any, metadata?: Record<string, any>): void;
    /**
     * Log de niveau success (personnalisé)
     */
    success(message: string, metadata?: Record<string, any>): void;
    /**
     * Log de niveau debug
     */
    debug(message: string, metadata?: Record<string, any>): void;
    /**
     * Log de niveau http (pour les requêtes HTTP)
     */
    http(message: string, metadata?: Record<string, any>): void;
    /**
     * Créer un logger enfant avec des métadonnées par défaut
     * Utile pour ajouter un contexte (request ID, user ID, etc.)
     */
    child(defaultMetadata: Record<string, any>): Logger;
    /**
     * Accès direct au logger Winston si nécessaire
     */
    getWinstonLogger(): winston.Logger;
}
export declare const logger: Logger;
export declare const morganStream: {
    write: (message: string) => void;
};
export {};
//# sourceMappingURL=logger.d.ts.map