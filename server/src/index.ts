import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logger, morganStream } from './utils/logger';
import { prisma } from './config/prisma';
import { generateCsrfToken } from './middlewares/csrf';
import setupRoutes from './routes/setupRoutes';
import authRoutes from './routes/authRoutes';
import monteurRoutes from './routes/monteurRoutes';
import userRoutes from './routes/userRoutes';
import chantierRoutes from './routes/chantierRoutes';
import feuilleRoutes from './routes/feuilleRoutes';
import fichierRoutes from './routes/fichierRoutes';
import analyticsRoutes from './routes/analyticsRoutes';

const app = express();
const PORT = env.port;

// Middlewares
app.use(helmet());
app.use(cors({ origin: env.clientUrl === '*' ? true : env.clientUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: morganStream }));

// Rate Limit
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // Augmenté à 300 par IP
    standardHeaders: true,
    legacyHeaders: false,
    // Ne pas limiter les routes de setup qui sont appelées au démarrage
    skip: (req) => req.path.includes('/setup') || req.path.includes('/auth/me')
});
app.use('/api', limiter);

// CSRF Token Endpoint
app.get('/api/csrf-token', generateCsrfToken);

// Auth Routes
app.use('/api/auth', authRoutes);

// Setup Routes (handling both /setup and /api/setup/status depending on frontend)
app.use('/setup', setupRoutes);
app.use('/api/setup', setupRoutes);

// Business Logic Routes
app.use('/api/monteurs', monteurRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chantiers', chantierRoutes);
app.use('/api/feuilles', feuilleRoutes);
app.use('/api/fichiers', fichierRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health Check Route
app.get('/health', async (req, res) => {
    let dbStatus = 'Disconnected';
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'Connected';
    } catch (error: any) {
        dbStatus = `Error: ${error.message}`;
        logger.error('DB Health Check Failed:', error);
    }

    res.json({
        status: 'OK',
        server: 'online',
        database: dbStatus,
        timestamp: new Date().toISOString(),
        env: env.nodeEnv
    });
});

// Root Route
app.get('/', (req, res) => {
    res.json({
        message: 'Claude API Server is running',
        endpoints: {
            health: '/health',
            csrf: '/api/csrf-token',
            setup: '/setup/status'
        }
    });
});

// Start Server
const startServer = async () => {
    try {
        logger.info('Starting server...');

        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`Server running on port ${PORT}`);
        });

        try {
            await prisma.$connect();
            logger.info('Database connection established');
        } catch (e) {
            logger.error('Database connection failed initially', e);
        }

    } catch (error) {
        logger.error('Server failed to start', error);
        process.exit(1);
    }
};

startServer();
