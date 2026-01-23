import { Router } from 'express';
import { authenticate } from '../middlewares/auth';

const router = Router();

// NOTE: Le modèle Fichier n'existe pas encore dans le schéma Prisma
// Ces routes retournent des données vides pour éviter les erreurs 404
// TODO: Créer le modèle Fichier dans schema.prisma et implémenter les routes

router.post('/upload', authenticate, async (req, res) => {
    res.status(501).json({ success: false, message: 'Fonctionnalité non implémentée' });
});

router.get('/feuille/:feuilleId', authenticate, async (req, res) => {
    res.json({ success: true, data: [] });
});

router.delete('/:id', authenticate, async (req, res) => {
    res.status(501).json({ success: false, message: 'Fonctionnalité non implémentée' });
});

export default router;
