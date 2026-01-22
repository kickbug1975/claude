import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logger, morganStream } from './utils/logger';
import { prisma } from './config/prisma';

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
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

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
        docs: '/health'
    });
});

// Start Server
const startServer = async () => {
    try {
        // Log startup info
        logger.info('Starting server...');

        // Listen first, connect DB later/parallel to avoid startup timeout if DB is slow
        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`Server running on port ${PORT}`);
        });

        // Try DB connection
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
