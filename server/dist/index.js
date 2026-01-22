"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const swagger_1 = require("./config/swagger");
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middlewares/errorHandler");
const csrf_1 = require("./middlewares/csrf");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const monteurRoutes_1 = __importDefault(require("./routes/monteurRoutes"));
const chantierRoutes_1 = __importDefault(require("./routes/chantierRoutes"));
const feuilleRoutes_1 = __importDefault(require("./routes/feuilleRoutes"));
const fichierRoutes_1 = __importDefault(require("./routes/fichierRoutes"));
const cronRoutes_1 = __importDefault(require("./routes/cronRoutes"));
const setupRoutes_1 = __importDefault(require("./routes/setupRoutes"));
const cronService_1 = require("./services/cronService");
const emailService_1 = require("./services/emailService");
const app = (0, express_1.default)();
// Middlewares de sécurité
// Configurer helmet pour autoriser Swagger UI
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
        },
    },
}));
// CORS - Accepter localhost sur plusieurs ports en développement
const corsOrigins = env_1.env.nodeEnv === 'development'
    ? [env_1.env.clientUrl, 'http://localhost:3001', 'http://localhost:3002', 'http://192.168.169.29:3002']
    : env_1.env.clientUrl;
app.use((0, cors_1.default)({
    origin: corsOrigins,
    credentials: true,
}));
// Rate limiting - Protection contre les attaques par force brute
const limiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.rateLimit.windowMs,
    max: env_1.env.nodeEnv === 'development' ? 1000 : env_1.env.rateLimit.maxRequests,
    message: {
        success: false,
        message: 'Trop de requetes, veuillez reessayer plus tard',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Rate limiting plus strict pour l'authentification
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env_1.env.nodeEnv === 'development' ? 100 : 10, // 100 tentatives max en dev
    message: {
        success: false,
        message: 'Trop de tentatives de connexion, veuillez reessayer dans 15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Appliquer le rate limiting global (sauf en test et dev pour éviter les blocages)
if (env_1.env.nodeEnv !== 'test' && env_1.env.nodeEnv !== 'development') {
    app.use('/api', limiter);
}
// Logging HTTP avec Morgan + Winston
if (env_1.env.nodeEnv === 'development') {
    app.use((0, morgan_1.default)('dev', { stream: logger_1.morganStream }));
}
else {
    app.use((0, morgan_1.default)('combined', { stream: logger_1.morganStream }));
}
// Body parsing
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Route de santé
app.get('/health', async (_req, res) => {
    try {
        // Test de la connexion à la base de données
        await database_1.prisma.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: 'OK',
            message: 'Server is running',
            database: 'Connected',
            environment: env_1.env.nodeEnv,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'ERROR',
            message: 'Database connection failed',
            environment: env_1.env.nodeEnv,
            timestamp: new Date().toISOString(),
        });
    }
});
// Route de base
app.get('/', (_req, res) => {
    res.json({
        message: '🚀 API Maintenance - Gestion Feuilles de Travail',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            api: '/api',
            csrf: '/api/csrf-token',
            docs: '/api-docs',
            openapi: '/api-docs.json',
        },
    });
});
/**
 * @swagger
 * /api/csrf-token:
 *   get:
 *     summary: Obtenir un token CSRF
 *     description: Génère et retourne un token CSRF nécessaire pour les requêtes mutantes (POST, PUT, PATCH, DELETE)
 *     tags: [CSRF]
 *     security: []
 *     responses:
 *       200:
 *         description: Token CSRF généré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 csrfToken:
 *                   type: string
 *                   example: c5f6a9b0d3e2f1a4...
 */
app.get('/api/csrf-token', csrf_1.generateCsrfToken);
// Documentation API Swagger
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Maintenance - Documentation',
}));
// Servir la spec OpenAPI en JSON
app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swagger_1.swaggerSpec);
});
// Servir les fichiers uploadés localement (fallback si S3 non configuré)
const uploadsPath = path_1.default.join(process.cwd(), 'uploads');
logger_1.logger.info(`Serving static files from: ${uploadsPath}`);
app.use('/uploads', (req, res, next) => {
    logger_1.logger.info(`Request for static file: ${req.url}`);
    // Permettre l'accès CORS pour les images (ex: pour jsPDF)
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express_1.default.static(uploadsPath));
// Protection CSRF pour toutes les routes API (sauf GET/HEAD/OPTIONS et sauf en test)
if (env_1.env.nodeEnv !== 'test') {
    app.use('/api', csrf_1.csrfProtection);
}
// Routes API
const authMiddlewares = env_1.env.nodeEnv === 'test' ? [] : [authLimiter];
app.use('/api/auth', ...authMiddlewares, authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/monteurs', monteurRoutes_1.default);
app.use('/api/chantiers', chantierRoutes_1.default);
app.use('/api/feuilles', feuilleRoutes_1.default);
app.use('/api/fichiers', fichierRoutes_1.default);
app.use('/api/cron', cronRoutes_1.default);
app.use('/api/setup', setupRoutes_1.default);
// Gestion des erreurs 404
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée',
    });
});
// Middleware de gestion des erreurs CSRF
app.use(csrf_1.csrfErrorHandler);
// Middleware global de gestion des erreurs
app.use(errorHandler_1.errorHandler);
// Démarrage du serveur
const PORT = env_1.env.port;
const startServer = async () => {
    try {
        // Connexion à la base de données
        await (0, database_1.connectDatabase)();
        // Démarrage du serveur Express
        app.listen(PORT, () => {
            logger_1.logger.info(`
  ╔═══════════════════════════════════════╗
  ║  🚀 Serveur démarré avec succès       ║
  ║                                       ║
  ║  📍 Port: ${PORT}                        ║
  ║  🌍 Environnement: ${env_1.env.nodeEnv.padEnd(14)} ║
  ║  🔗 URL: http://localhost:${PORT}        ║
  ║                                       ║
  ║  ✅ TypeScript configuré              ║
  ║  ✅ Express configuré                 ║
  ║  ✅ Sécurité (Helmet + CORS + CSRF)   ║
  ║  ✅ PostgreSQL connecté               ║
  ║  ✅ Upload fichiers (S3/Local)        ║
  ║  ✅ Tâches planifiées (node-cron)     ║
  ╚═══════════════════════════════════════╝
      `);
            // Vérifier la configuration email au démarrage
            (0, emailService_1.verifyEmailConfig)();
            // Démarrer les tâches planifiées
            (0, cronService_1.startCronJobs)();
        });
    }
    catch (error) {
        logger_1.logger.error('Erreur lors du démarrage du serveur', error instanceof Error ? error : undefined);
        process.exit(1);
    }
};
if (require.main === module) {
    startServer();
}
exports.default = app;
//# sourceMappingURL=index.js.map