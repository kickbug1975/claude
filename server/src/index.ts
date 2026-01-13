import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import path from 'path'
import { env } from './config/env'
import { swaggerSpec } from './config/swagger'
import { connectDatabase, prisma } from './config/database'
import { logger, morganStream } from './utils/logger'
import { errorHandler } from './middlewares/errorHandler'
import { csrfProtection, generateCsrfToken, csrfErrorHandler } from './middlewares/csrf'
import authRoutes from './routes/authRoutes'
import monteurRoutes from './routes/monteurRoutes'
import chantierRoutes from './routes/chantierRoutes'
import feuilleRoutes from './routes/feuilleRoutes'
import fichierRoutes from './routes/fichierRoutes'
import cronRoutes from './routes/cronRoutes'
import { startCronJobs } from './services/cronService'

const app: Application = express()

// Middlewares de sécurité
// Configurer helmet pour autoriser Swagger UI
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
      },
    },
  })
)

// CORS - Accepter localhost sur plusieurs ports en développement
const corsOrigins = env.nodeEnv === 'development'
  ? [env.clientUrl, 'http://localhost:3001', 'http://localhost:3002']
  : env.clientUrl

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
)

// Rate limiting - Protection contre les attaques par force brute
const limiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Trop de requetes, veuillez reessayer plus tard',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limiting plus strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 tentatives max
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, veuillez reessayer dans 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Appliquer le rate limiting global
app.use('/api', limiter)

// Logging HTTP avec Morgan + Winston
if (env.nodeEnv === 'development') {
  app.use(morgan('dev', { stream: morganStream }))
} else {
  app.use(morgan('combined', { stream: morganStream }))
}

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Route de santé
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Test de la connexion à la base de données
    await prisma.$queryRaw`SELECT 1`

    res.status(200).json({
      status: 'OK',
      message: 'Server is running',
      database: 'Connected',
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Database connection failed',
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    })
  }
})

// Route de base
app.get('/', (_req: Request, res: Response) => {
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
  })
})

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
app.get('/api/csrf-token', generateCsrfToken)

// Documentation API Swagger
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Maintenance - Documentation',
  })
)

// Servir la spec OpenAPI en JSON
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// Servir les fichiers uploadés localement (fallback si S3 non configuré)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Protection CSRF pour toutes les routes API (sauf GET/HEAD/OPTIONS)
app.use('/api', csrfProtection)

// Routes API
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/monteurs', monteurRoutes)
app.use('/api/chantiers', chantierRoutes)
app.use('/api/feuilles', feuilleRoutes)
app.use('/api/fichiers', fichierRoutes)
app.use('/api/cron', cronRoutes)

// Gestion des erreurs 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
  })
})

// Middleware de gestion des erreurs CSRF
app.use(csrfErrorHandler)

// Middleware global de gestion des erreurs
app.use(errorHandler)

// Démarrage du serveur
const PORT = env.port

const startServer = async () => {
  try {
    // Connexion à la base de données
    await connectDatabase()

    // Démarrage du serveur Express
    app.listen(PORT, () => {
      logger.info(`
  ╔═══════════════════════════════════════╗
  ║  🚀 Serveur démarré avec succès       ║
  ║                                       ║
  ║  📍 Port: ${PORT}                        ║
  ║  🌍 Environnement: ${env.nodeEnv.padEnd(14)} ║
  ║  🔗 URL: http://localhost:${PORT}        ║
  ║                                       ║
  ║  ✅ TypeScript configuré              ║
  ║  ✅ Express configuré                 ║
  ║  ✅ Sécurité (Helmet + CORS + CSRF)   ║
  ║  ✅ PostgreSQL connecté               ║
  ║  ✅ Upload fichiers (S3/Local)        ║
  ║  ✅ Tâches planifiées (node-cron)     ║
  ╚═══════════════════════════════════════╝
      `)

      // Démarrer les tâches planifiées
      startCronJobs()
    })
  } catch (error) {
    logger.error('Erreur lors du démarrage du serveur', error instanceof Error ? error : undefined)
    process.exit(1)
  }
}

startServer()

export default app
