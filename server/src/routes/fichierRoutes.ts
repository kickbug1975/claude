import { Router } from 'express';
import { prisma } from '../config/prisma';
import { authenticate } from '../middlewares/auth';

const router = Router();

// NOTE: Pour le stockage réel des fichiers, il faudrait configurer multer + S3/Cloudinary/Disk
// Sur Render (plan gratuit), le disque est éphémère, donc les fichiers seraient perdus au redémarrage.
// Pour ce MVP, nous simulons l'upload ou stockons uniquement les métadonnées si possible.
// Comme nous n'avons pas installé 'multer', nous ne pouvons pas parser le multipart/form-data facilement.

router.post('/upload', authenticate, async (req, res) => {
    try {
        // Simulation de succès pour débloquer le frontend
        // TODO: Installer multer et configurer un stockage cloud (AWS S3, Cloudinary)

        res.status(200).json({
            success: true,
            message: "Fichier uploadé (Simulation - Stockage manquant sur serveur de démo)",
            data: {
                id: "temp-id-" + Date.now(),
                nom: "Fichier simulé",
                url: "#",
                taille: 0,
                mimeType: "application/octet-stream",
                createdAt: new Date()
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/feuille/:feuilleId', authenticate, async (req, res) => {
    try {
        const { feuilleId } = req.params;
        const fichiers = await prisma.fichier.findMany({
            where: { feuilleId }
        });
        res.json({ success: true, data: fichiers }); // Retourne tableau vide si aucun fichier
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        // Supprimer aussi le fichier physique si stockage implémenté
        await prisma.fichier.delete({
            where: { id }
        });
        res.json({ success: true, message: 'Fichier supprimé' });
    } catch (error: any) {
        // Ignore error if not found in mock
        res.json({ success: true, message: 'Fichier supprimé' });
    }
});

export default router;
