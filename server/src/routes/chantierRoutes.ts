import { Router } from 'express';
import { authenticate } from '../middlewares/auth';

const router = Router();

// NOTE: Le modèle Chantier n'existe pas encore dans le schéma Prisma
// Ces routes retournent des données vides pour éviter les erreurs 404
// TODO: Créer le modèle Chantier dans schema.prisma et implémenter les routes

router.get('/', authenticate, async (req, res) => {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    res.json({
        success: true,
        data: [],
        pagination: {
            page: pageNum,
            pageSize: limitNum,
            total: 0,
            totalPages: 0,
        },
    });
});

router.get('/:id', authenticate, async (req, res) => {
    res.status(404).json({ success: false, message: 'Chantier non trouvé' });
});

router.post('/', authenticate, async (req, res) => {
    res.status(501).json({ success: false, message: 'Fonctionnalité non implémentée' });
});

router.put('/:id', authenticate, async (req, res) => {
    res.status(501).json({ success: false, message: 'Fonctionnalité non implémentée' });
});

router.delete('/:id', authenticate, async (req, res) => {
    res.status(501).json({ success: false, message: 'Fonctionnalité non implémentée' });
});

export default router;
