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
            include: { maintenanceUser: true },
        });

        if (!monteur) {
            return res.status(404).json({ success: false, message: 'Monteur non trouvé' });
        }

        res.json({ success: true, data: monteur });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/monteurs/:id/stats - Récupère les statistiques d'un monteur
router.get('/:id/stats', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { mois, annee } = req.query;

        // Construire le filtre de date
        let dateFilter: any = {};
        if (mois && annee) {
            const startDate = new Date(Number(annee), Number(mois) - 1, 1);
            const endDate = new Date(Number(annee), Number(mois), 0);
            dateFilter = {
                dateTravail: {
                    gte: startDate,
                    lte: endDate
                }
            };
        } else if (annee) {
            const startDate = new Date(Number(annee), 0, 1);
            const endDate = new Date(Number(annee), 11, 31);
            dateFilter = {
                dateTravail: {
                    gte: startDate,
                    lte: endDate
                }
            };
        }

        // Récupérer les feuilles du monteur
        const feuilles = await prisma.feuilleTravail.findMany({
            where: {
                monteurId: id,
                ...dateFilter
            },
            include: {
                chantier: true,
                frais: true
            },
            orderBy: {
                dateTravail: 'desc'
            }
        });

        // Calculer les statistiques
        const nombreFeuilles = feuilles.length;
        const heuresTotales = feuilles.reduce((acc, f) => {
            const heures = (f.heuresMatin || 0) + (f.heuresApresMidi || 0) + (f.heuresDeplace || 0);
            return acc + heures;
        }, 0);

        const fraisTotaux = feuilles.reduce((acc, f) => {
            const totalFraisFeuille = f.frais.reduce((sum, frais) => sum + (frais.montant || 0), 0);
            return acc + totalFraisFeuille;
        }, 0);

        // Feuilles récentes (5 dernières)
        const feuillesRecentes = feuilles.slice(0, 5).map(f => {
            const heures = (f.heuresMatin || 0) + (f.heuresApresMidi || 0) + (f.heuresDeplace || 0);
            return {
                id: f.id,
                dateTravail: f.dateTravail,
                heuresTotales: heures,
                statut: f.statut,
                chantier: {
                    nom: f.chantier?.nom || 'Inconnu',
                    reference: (f.chantier as any)?.reference || '-'
                }
            };
        });

        res.json({
            success: true,
            data: {
                heuresTotales,
                nombreFeuilles,
                fraisTotaux,
                feuillesRecentes
            }
        });

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
