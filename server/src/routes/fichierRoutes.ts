import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth'
import { upload } from '../config/multer'
import {
  uploadFiles,
  getFilesByFeuille,
  getFileById,
  deleteFile,
  attachFileToFeuille,
  getStorageInfo,
} from '../controllers/fichierController'

const router = Router()

// Toutes les routes nécessitent une authentification
router.use(authenticate)

/**
 * @swagger
 * /api/fichiers/storage-info:
 *   get:
 *     summary: Informations sur le stockage
 *     description: Retourne le type de stockage actif (S3 ou Local) et la configuration
 *     tags: [Fichiers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Infos de stockage récupérées
 */
router.get('/storage-info', getStorageInfo)

/**
 * @swagger
 * /api/fichiers/upload:
 *   post:
 *     summary: Upload de fichiers
 *     description: Télécharge jusqu'à 5 fichiers. Utilise multipart/form-data.
 *     tags: [Fichiers]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Fichiers uploadés avec succès
 */
router.post('/upload', upload.array('files', 5), uploadFiles)

/**
 * @swagger
 * /api/fichiers/feuille/{feuilleId}:
 *   get:
 *     summary: Fichiers d'une feuille
 *     description: Liste tous les fichiers attachés à une feuille de travail spécifique
 *     tags: [Fichiers]
 *     parameters:
 *       - in: path
 *         name: feuilleId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Liste des fichiers
 */
router.get('/feuille/:feuilleId', getFilesByFeuille)

/**
 * @swagger
 * /api/fichiers/{id}:
 *   get:
 *     summary: Récupérer un fichier
 *     description: Retourne les métadonnées et l'URL d'un fichier par son ID
 *     tags: [Fichiers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Fichier trouvé
 */
router.get('/:id', getFileById)

/**
 * @swagger
 * /api/fichiers/{id}:
 *   delete:
 *     summary: Supprimer un fichier
 *     description: Supprime un fichier du stockage (Admin/Superviseur uniquement)
 *     tags: [Fichiers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Fichier supprimé
 */
router.delete('/:id', authorize('ADMIN', 'SUPERVISEUR'), deleteFile)

/**
 * @swagger
 * /api/fichiers/{id}/attach:
 *   patch:
 *     summary: Attacher à une feuille
 *     description: Lie un fichier existant à une feuille de travail
 *     tags: [Fichiers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [feuilleId]
 *             properties:
 *               feuilleId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Fichier attaché
 */
router.patch('/:id/attach', attachFileToFeuille)

export default router
