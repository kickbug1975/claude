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

// GET /api/chantiers/:id/stats - Récupère les statistiques d'un chantier
router.get('/:id/stats', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Récupérer toutes les feuilles du chantier avec les infos nécessaires
        const feuilles = await prisma.feuilleTravail.findMany({
            where: { chantierId: id },
            include: {
                monteur: true,
                frais: true
            },
            orderBy: { dateTravail: 'desc' }
        });

        // Calculer les statistiques
        const nombreFeuilles = feuilles.length;

        const heuresTotales = feuilles.reduce((acc, f) => {
            const heures = (f.heuresMatin || 0) + (f.heuresApresMidi || 0) + (f.heuresDeplace || 0);
            return acc + heures;
        }, 0);

        const fraisTotaux = feuilles.reduce((acc, f) => {
            const fraisFeuille = f.frais.reduce((sum, fr) => sum + (fr.montant || 0), 0);
            return acc + fraisFeuille;
        }, 0);

        // Compter les monteurs uniques
        const monteursUniques = new Set(feuilles.map(f => f.monteurId));
        const nombreMonteurs = monteursUniques.size;

        // Préparer les feuilles récentes (5 dernières)
        const feuillesRecentes = feuilles.slice(0, 5).map(f => {
            const heures = (f.heuresMatin || 0) + (f.heuresApresMidi || 0) + (f.heuresDeplace || 0);
            return {
                id: f.id,
                dateTravail: f.dateTravail,
                heuresTotales: heures,
                statut: f.statut,
                monteur: {
                    prenom: f.monteur?.prenom || 'Inconnu',
                    nom: f.monteur?.nom || '',
                    numeroIdentification: f.monteur?.numeroIdentification || '-'
                }
            };
        });

        res.json({
            success: true,
            data: {
                heuresTotales,
                nombreFeuilles,
                fraisTotaux,
                nombreMonteurs,
                feuillesRecentes
            }
        });

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

        // Filtrer les champs autorisés
        const allowedFields = ['nom', 'reference', 'adresse', 'client', 'dateDebut', 'dateFin', 'statut', 'description', 'actif'];
        const updateData: any = {};

        Object.keys(data).forEach(key => {
            if (allowedFields.includes(key)) {
                updateData[key] = data[key];
            }
        });

        if (updateData.dateDebut) updateData.dateDebut = new Date(updateData.dateDebut);
        if (updateData.dateFin) updateData.dateFin = new Date(updateData.dateFin);

        const chantier = await prisma.chantier.update({
            where: { id },
            data: updateData
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
