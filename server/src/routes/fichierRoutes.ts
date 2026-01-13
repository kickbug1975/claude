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

// GET /api/fichiers/storage-info - Informations sur le stockage
router.get('/storage-info', getStorageInfo)

// POST /api/fichiers/upload - Upload de fichiers (max 5)
router.post('/upload', upload.array('files', 5), uploadFiles)

// GET /api/fichiers/feuille/:feuilleId - Fichiers d'une feuille
router.get('/feuille/:feuilleId', getFilesByFeuille)

// GET /api/fichiers/:id - Récupérer un fichier par ID
router.get('/:id', getFileById)

// DELETE /api/fichiers/:id - Supprimer un fichier (Admin/Superviseur uniquement)
router.delete('/:id', authorize('ADMIN', 'SUPERVISEUR'), deleteFile)

// PATCH /api/fichiers/:id/attach - Attacher un fichier à une feuille
router.patch('/:id/attach', attachFileToFeuille)

export default router
