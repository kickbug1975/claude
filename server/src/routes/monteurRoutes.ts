import { Router } from 'express'
import {
  getAllMonteurs,
  getMonteurById,
  createMonteur,
  updateMonteur,
  deleteMonteur,
  getMonteurStats,
} from '../controllers/monteurController'
import { authenticate, authorize } from '../middlewares/auth'

const router = Router()

// Toutes les routes nécessitent une authentification
router.use(authenticate)

// GET /api/monteurs - Liste des monteurs
router.get('/', getAllMonteurs)

// GET /api/monteurs/:id - Détails d'un monteur
router.get('/:id', getMonteurById)

// GET /api/monteurs/:id/stats - Statistiques d'un monteur
router.get('/:id/stats', getMonteurStats)

// POST /api/monteurs - Créer un monteur (Admin seulement)
router.post('/', authorize('ADMIN'), createMonteur)

// PUT /api/monteurs/:id - Modifier un monteur (Admin seulement)
router.put('/:id', authorize('ADMIN'), updateMonteur)

// DELETE /api/monteurs/:id - Supprimer un monteur (Admin seulement)
router.delete('/:id', authorize('ADMIN'), deleteMonteur)

export default router
