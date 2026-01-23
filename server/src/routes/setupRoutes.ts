import { Router } from 'express';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Endpoint pour vérifier si l'application est configurée (admin créé)
router.get('/status', async (req, res) => {
    try {
        const userCount = await prisma.user.count();
        const isSetup = userCount > 0;

        res.json({
            success: true,
            data: {
                isSetupComplete: isSetup,
                configured: isSetup,
                maintenanceMode: false,
                version: '1.0.0'
            }
        });
    } catch (error) {
        logger.error('Error checking setup status', error);
        res.status(500).json({ error: 'Database check failed' });
    }
});

export default router;
