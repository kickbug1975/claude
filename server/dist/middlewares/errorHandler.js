"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, _req, res, _next) => {
    logger_1.logger.error('Error:', err.message);
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(env_1.env.nodeEnv === 'development' && { stack: err.stack }),
        });
    }
    // Erreur inconnue
    return res.status(500).json({
        success: false,
        message: 'Une erreur interne est survenue',
        ...(env_1.env.nodeEnv === 'development' && { error: err.message, stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map