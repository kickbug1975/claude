"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfErrorHandler = exports.csrfProtection = exports.generateCsrfToken = void 0;
const crypto_1 = require("crypto");
const env_1 = require("../config/env");
// Map pour stocker les tokens CSRF (en production, utiliser Redis)
const csrfTokens = new Map();
// Nettoyer les tokens expirés toutes les heures
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of csrfTokens.entries()) {
        if (value.expires < now) {
            csrfTokens.delete(key);
        }
    }
}, 60 * 60 * 1000);
/**
 * Génère un token CSRF sécurisé
 */
function generateToken(sessionId) {
    const token = (0, crypto_1.randomBytes)(32).toString('hex');
    const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 heures
    csrfTokens.set(sessionId, { token, expires });
    return token;
}
/**
 * Valide un token CSRF
 */
function validateToken(sessionId, token) {
    const stored = csrfTokens.get(sessionId);
    if (!stored) {
        return false;
    }
    if (stored.expires < Date.now()) {
        csrfTokens.delete(sessionId);
        return false;
    }
    return stored.token === token;
}
/**
 * Obtient l'identifiant de session depuis la requête
 */
function getSessionId(req) {
    // Utiliser l'IP + User-Agent comme identifiant de session
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return (0, crypto_1.createHmac)('sha256', env_1.env.jwtSecret)
        .update(`${ip}-${userAgent}`)
        .digest('hex');
}
/**
 * Middleware pour générer et envoyer le token CSRF au client
 */
const generateCsrfToken = (req, res, _next) => {
    try {
        const sessionId = getSessionId(req);
        const token = generateToken(sessionId);
        res.json({
            success: true,
            csrfToken: token,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Impossible de générer le token CSRF',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.generateCsrfToken = generateCsrfToken;
/**
 * Middleware de protection CSRF
 * À appliquer sur les routes nécessitant une protection
 */
const csrfProtection = (req, res, next) => {
    // Exempter les méthodes GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    const sessionId = getSessionId(req);
    const token = req.headers['x-csrf-token'];
    if (!token) {
        return res.status(403).json({
            success: false,
            message: 'Token CSRF manquant',
            error: 'CSRF_VALIDATION_FAILED',
        });
    }
    if (!validateToken(sessionId, token)) {
        return res.status(403).json({
            success: false,
            message: 'Token CSRF invalide ou expiré',
            error: 'CSRF_VALIDATION_FAILED',
        });
    }
    next();
};
exports.csrfProtection = csrfProtection;
/**
 * Middleware d'erreur CSRF personnalisé
 */
const csrfErrorHandler = (err, _req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN' || err.message?.includes('csrf')) {
        res.status(403).json({
            success: false,
            message: 'Token CSRF invalide ou manquant',
            error: 'CSRF_VALIDATION_FAILED',
        });
        return;
    }
    next(err);
};
exports.csrfErrorHandler = csrfErrorHandler;
//# sourceMappingURL=csrf.js.map