import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env'

const app: Application = express()

// Middlewares de sécurité
app.use(helmet())
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
)

// Logging
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'))
}

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Route de santé
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  })
})

// Route de base
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: '🚀 API Maintenance - Gestion Feuilles de Travail',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
    },
  })
})

// Routes API (à implémenter)
// app.use('/api/auth', authRoutes)
// app.use('/api/monteurs', monteurRoutes)
// app.use('/api/chantiers', chantierRoutes)
// app.use('/api/feuilles', feuilleRoutes)

// Gestion des erreurs 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
  })
})

// Démarrage du serveur
const PORT = env.port

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║  🚀 Serveur démarré avec succès       ║
  ║                                       ║
  ║  📍 Port: ${PORT}                        ║
  ║  🌍 Environnement: ${env.nodeEnv.padEnd(14)} ║
  ║  🔗 URL: http://localhost:${PORT}        ║
  ║                                       ║
  ║  ✅ TypeScript configuré              ║
  ║  ✅ Express configuré                 ║
  ║  ✅ Sécurité (Helmet + CORS)          ║
  ╚═══════════════════════════════════════╝
  `)
})

export default app
