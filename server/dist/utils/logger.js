"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.morganStream = exports.logger = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const env_1 = require("../config/env");
const path_1 = __importDefault(require("path"));
// =====================================================
// Configuration Winston
// =====================================================
const { combine, timestamp, errors, json, printf, colorize, align } = winston_1.default.format;
// Format personnalisé pour le développement (lisible, coloré)
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}] ${message}`;
    // Ajouter les métadonnées si présentes
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
});
// Format pour la production (JSON structuré)
const prodFormat = combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json());
// Transports selon l'environnement
const transports = [];
if (env_1.env.nodeEnv === 'development' || env_1.env.nodeEnv === 'test') {
    // Console pour le développement avec couleurs
    transports.push(new winston_1.default.transports.Console({
        level: 'debug',
        format: combine(colorize({ all: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), align(), devFormat),
    }));
}
else {
    // Production: Fichiers avec rotation quotidienne
    // Logs combinés (tous les niveaux)
    transports.push(new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(process.cwd(), 'logs', 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d', // Garder 14 jours
        level: 'info',
        format: prodFormat,
    }));
    // Logs d'erreurs uniquement
    transports.push(new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(process.cwd(), 'logs', 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d', // Garder 30 jours pour les erreurs
        level: 'error',
        format: prodFormat,
    }));
    // Console minimaliste en production
    transports.push(new winston_1.default.transports.Console({
        level: 'info',
        format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
    }));
}
// Créer le logger Winston
const winstonLogger = winston_1.default.createLogger({
    level: env_1.env.nodeEnv === 'production' ? 'info' : 'debug',
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        success: 3, // Niveau personnalisé pour les succès
        debug: 4,
    },
    transports,
    exitOnError: false,
});
// Ajouter des couleurs personnalisées
winston_1.default.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    http: 'magenta',
    success: 'green',
    debug: 'blue',
});
// =====================================================
// Classe Logger avec méthodes pratiques
// =====================================================
class Logger {
    constructor(winstonLogger) {
        this.winstonLogger = winstonLogger;
    }
    /**
     * Log de niveau info
     */
    info(message, metadata) {
        this.winstonLogger.info(message, metadata);
    }
    /**
     * Log de niveau warn
     */
    warn(message, metadata) {
        this.winstonLogger.warn(message, metadata);
    }
    /**
     * Log de niveau error
     */
    error(message, error, metadata) {
        if (error instanceof Error) {
            this.winstonLogger.error(message, {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
                ...metadata,
            });
        }
        else if (error && typeof error === 'object') {
            this.winstonLogger.error(message, { error, ...metadata });
        }
        else {
            this.winstonLogger.error(message, metadata);
        }
    }
    /**
     * Log de niveau success (personnalisé)
     */
    success(message, metadata) {
        this.winstonLogger.log('success', message, metadata);
    }
    /**
     * Log de niveau debug
     */
    debug(message, metadata) {
        this.winstonLogger.debug(message, metadata);
    }
    /**
     * Log de niveau http (pour les requêtes HTTP)
     */
    http(message, metadata) {
        this.winstonLogger.http(message, metadata);
    }
    /**
     * Créer un logger enfant avec des métadonnées par défaut
     * Utile pour ajouter un contexte (request ID, user ID, etc.)
     */
    child(defaultMetadata) {
        return new Logger(this.winstonLogger.child(defaultMetadata));
    }
    /**
     * Accès direct au logger Winston si nécessaire
     */
    getWinstonLogger() {
        return this.winstonLogger;
    }
}
exports.logger = new Logger(winstonLogger);
// Stream pour Morgan (logging HTTP)
exports.morganStream = {
    write: (message) => {
        exports.logger.http(message.trim());
    },
};
//# sourceMappingURL=logger.js.map