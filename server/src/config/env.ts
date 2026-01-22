import dotenv from 'dotenv';
import path from 'path';

// Load .env from server root if available
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    clientUrl: process.env.CLIENT_URL || '*', // Allow all origins by default in recovery mode
    databaseUrl: process.env.DATABASE_URL || '',
    jwtSecret: process.env.JWT_SECRET || 'recovery-secret-key', // Fallback to avoid crash on startup
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
    }
};

// Log environment status for debugging
console.log('--- Environment Config ---');
console.log(`NODE_ENV: ${env.nodeEnv}`);
console.log(`PORT: ${env.port}`);
console.log(`CLIENT_URL: ${env.clientUrl}`);
console.log(`DATABASE_URL Present: ${!!env.databaseUrl}`);
console.log('-------------------------');
