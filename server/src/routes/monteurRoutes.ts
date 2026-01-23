import { Router } from 'express';
import { prisma } from '../config/prisma';
import { authenticate } from '../middlewares/auth';

const router = Router();

// GET /api/monteurs - Liste tous les monteurs
router.get('/', authenticate, async (req, res) => {
    try {
        const { actif, page = '1', limit = '20' } = req.query;

        const where: any = {};
        if (actif !== undefined) {
            where.actif = actif === 'true';
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const [monteurs, total] = await Promise.all([
            prisma.monteur.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.monteur.count({ where }),
        ]);

        res.json({
            success: true,
            data: monteurs,
            pagination: {
                page: pageNum,
                pageSize: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/monteurs/:id - Récupère un monteur par ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const monteur = await prisma.monteur.findUnique({
            where: { id },
            include: { user: true },
        });

        if (!monteur) {
            return res.status(404).json({ success: false, message: 'Monteur non trouvé' });
        }

        res.json({ success: true, data: monteur });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/monteurs - Crée un nouveau monteur
router.post('/', authenticate, async (req, res) => {
    try {
        const { dateEmbauche, ...rest } = req.body;

        const monteur = await prisma.monteur.create({
            data: {
                ...rest,
                dateEmbauche: dateEmbauche ? new Date(dateEmbauche) : new Date(),
            },
        });

        res.status(201).json({ success: true, data: monteur });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/monteurs/:id - Met à jour un monteur
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { dateEmbauche, ...rest } = req.body;

        const monteur = await prisma.monteur.update({
            where: { id },
            data: {
                ...rest,
                ...(dateEmbauche && { dateEmbauche: new Date(dateEmbauche) }),
            },
        });

        res.json({ success: true, data: monteur });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Monteur non trouvé' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/monteurs/:id - Supprime un monteur
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.monteur.delete({
            where: { id },
        });

        res.json({ success: true, message: 'Monteur supprimé' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Monteur non trouvé' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
