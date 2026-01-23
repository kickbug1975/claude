import { Router } from 'express';
import { prisma } from '../config/prisma';
import { authenticate } from '../middlewares/auth';

const router = Router();

// GET /api/chantiers
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

        const [chantiers, total] = await Promise.all([
            prisma.chantier.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { dateDebut: 'desc' }
            }),
            prisma.chantier.count({ where })
        ]);

        res.json({
            success: true,
            data: chantiers,
            pagination: {
                page: pageNum,
                pageSize: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/chantiers/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const chantier = await prisma.chantier.findUnique({
            where: { id }
        });

        if (!chantier) {
            return res.status(404).json({ success: false, message: 'Chantier non trouvé' });
        }

        res.json({ success: true, data: chantier });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/chantiers
router.post('/', authenticate, async (req, res) => {
    try {
        const data = req.body;
        // Conversion des dates
        if (data.dateDebut) data.dateDebut = new Date(data.dateDebut);
        if (data.dateFin) data.dateFin = new Date(data.dateFin);

        const chantier = await prisma.chantier.create({
            data: data
        });
        res.status(201).json({ success: true, data: chantier });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/chantiers/:id
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        if (data.dateDebut) data.dateDebut = new Date(data.dateDebut);
        if (data.dateFin) data.dateFin = new Date(data.dateFin);

        const chantier = await prisma.chantier.update({
            where: { id },
            data: data
        });
        res.json({ success: true, data: chantier });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Chantier non trouvé' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/chantiers/:id
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.chantier.delete({
            where: { id }
        });
        res.json({ success: true, message: 'Chantier supprimé' });
    } catch (error: any) {
        if (error.code === 'P2003') {
            return res.status(400).json({ success: false, message: 'Impossible de supprimer car lié à des feuilles de travail.' });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Chantier non trouvé' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
