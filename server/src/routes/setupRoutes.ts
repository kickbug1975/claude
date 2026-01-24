import { Router } from 'express';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Endpoint pour vérifier si l'application est configurée (admin créé)
router.get('/status', async (req, res) => {
    try {
        const userCount = await prisma.maintenanceUser.count();
        const isSetup = userCount > 0;

        // Count monteurs and chantiers for the frontend
        const monteurCount = await prisma.monteur.count();
        const chantierCount = await prisma.chantier.count();

        // Get company info if exists
        const company = await prisma.company.findFirst();

        res.json({
            success: true,
            data: {
                isSetupComplete: isSetup,
                configured: isSetup,
                hasAdmin: userCount > 0,
                counts: {
                    monteurs: monteurCount,
                    chantiers: chantierCount
                },
                company: company || null,
                maintenanceMode: false,
                version: '1.0.0'
            }
        });
    } catch (error) {
        logger.error('Error checking setup status', error);
        res.status(500).json({ error: 'Database check failed' });
    }
});

// Récupérer la configuration de l'entreprise
router.get('/company', async (req, res) => {
    try {
        const company = await prisma.company.findFirst();
        res.json({ success: true, data: company });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mettre à jour la configuration de l'entreprise
router.put('/company', async (req, res) => {
    try {
        const data = req.body;
        // Upsert company (create if not exists, update if exists)
        // Since we don't know the ID, we use findFirst then update or create
        const existing = await prisma.company.findFirst();

        let company;
        if (existing) {
            company = await prisma.company.update({
                where: { id: existing.id },
                data: data
            });
        } else {
            company = await prisma.company.create({
                data: data
            });
        }

        res.json({ success: true, data: company });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Créer le compte admin initial
router.post('/admin', async (req, res) => {
    try {
        const userCount = await prisma.maintenanceUser.count();
        if (userCount > 0) {
            return res.status(400).json({ success: false, message: 'Setup already completed' });
        }

        const { email, password, name } = req.body;
        const bcrypt = await import('bcryptjs'); // Dynamique import pour éviter dépendance circulaire si possible
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.maintenanceUser.create({
            data: {
                email,
                password: hashedPassword,
                nom: name, // Mapping name -> nom
                role: 'ADMIN',
                isActive: true
            }
        });

        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Stubs pour les étapes optionnelles ou complexes (Logos, Import, Finalize)
router.post('/logos', (req, res) => {
    // TODO: Implémenter upload logo
    res.json({ success: true, message: 'Logo upload mocked' });
});

router.post('/import', (req, res) => {
    // TODO: Implémenter import données
    res.json({ success: true, message: 'Import mocked' });
});

router.post('/finalize', (req, res) => {
    res.json({ success: true, message: 'Setup finalized' });
});

export default router;
