import { Router } from 'express';
import { prisma } from '../config/prisma';
import { authenticate } from '../middlewares/auth';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/feuilles
router.get('/', authenticate, async (req, res) => {
    try {
        const { dateDebut, dateFin, monteurId, chantierId, statut, page = '1', limit = '20' } = req.query;

        const where: any = {};

        // Filtres
        if (monteurId) where.monteurId = monteurId as string;
        if (chantierId) where.chantierId = chantierId as string;
        if (statut) where.statut = statut as string;

        if (dateDebut || dateFin) {
            where.dateTravail = {};
            if (dateDebut) where.dateTravail.gte = new Date(dateDebut as string);
            if (dateFin) where.dateTravail.lte = new Date(dateFin as string);
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const [feuilles, total] = await Promise.all([
            prisma.feuilleTravail.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { dateTravail: 'desc' },
                include: {
                    monteur: { select: { nom: true, prenom: true } },
                    chantier: { select: { nom: true, client: true } },
                    _count: { select: { frais: true, fichiers: true } }
                }
            }),
            prisma.feuilleTravail.count({ where })
        ]);

        res.json({
            success: true,
            data: feuilles,
            pagination: {
                page: pageNum,
                pageSize: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error: any) {
        logger.error('Error fetching feuilles', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/feuilles/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const feuille = await prisma.feuilleTravail.findUnique({
            where: { id },
            include: {
                monteur: true,
                chantier: true,
                frais: true,
                fichiers: true
            }
        });

        if (!feuille) {
            return res.status(404).json({ success: false, message: 'Feuille de travail non trouvée' });
        }

        res.json({ success: true, data: feuille });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/feuilles
router.post('/', authenticate, async (req, res) => {
    try {
        const { frais, ...data } = req.body;

        // Conversion date
        if (data.dateTravail) data.dateTravail = new Date(data.dateTravail);

        // Création avec frais imbriqués
        const feuille = await prisma.feuilleTravail.create({
            data: {
                ...data,
                frais: frais ? {
                    create: frais
                } : undefined
            },
            include: {
                frais: true
            }
        });

        res.status(201).json({ success: true, data: feuille });
    } catch (error: any) {
        logger.error('Error creating feuille', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/feuilles/:id
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { frais, ...data } = req.body; // On ne gère pas les frais ici (endpoints dédiés ou logique complexe)

        if (data.dateTravail) data.dateTravail = new Date(data.dateTravail);

        const feuille = await prisma.feuilleTravail.update({
            where: { id },
            data: data,
            include: {
                frais: true
            }
        });

        res.json({ success: true, data: feuille });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Feuille non trouvée' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/feuilles/:id
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.feuilleTravail.delete({
            where: { id }
        });
        res.json({ success: true, message: 'Feuille supprimée' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Feuille non trouvée' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// Actions spécifiques (transitions de statut)

router.post('/:id/submit', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const feuille = await prisma.feuilleTravail.update({
            where: { id },
            data: { statut: 'SOUMIS' }
        });
        res.json({ success: true, data: feuille });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/:id/validate', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const feuille = await prisma.feuilleTravail.update({
            where: { id },
            data: { statut: 'VALIDE' }
        });
        res.json({ success: true, data: feuille });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/:id/reject', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        // Optionnel: raison du rejet dans body
        const feuille = await prisma.feuilleTravail.update({
            where: { id },
            data: { statut: 'REJETE' }
        });
        res.json({ success: true, data: feuille });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Gestion des frais

router.post('/:id/frais', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const fraisData = req.body;

        const frais = await prisma.frais.create({
            data: {
                ...fraisData,
                feuilleId: id
            }
        });
        res.status(201).json({ success: true, data: frais });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id/frais/:fraisId', authenticate, async (req, res) => {
    try {
        const { fraisId } = req.params;
        await prisma.frais.delete({
            where: { id: fraisId }
        });
        res.json({ success: true, message: 'Frais supprimé' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
