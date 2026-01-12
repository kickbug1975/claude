import { Router } from 'express'
import {
  getAllChantiers,
  getChantierById,
  createChantier,
  updateChantier,
  deleteChantier,
  getChantierStats,
} from '../controllers/chantierController'
import { authenticate, authorize } from '../middlewares/auth'

const router = Router()

// Toutes les routes nécessitent une authentification
router.use(authenticate)

// GET /api/chantiers - Liste des chantiers
router.get('/', getAllChantiers)

// GET /api/chantiers/:id - Détails d'un chantier
router.get('/:id', getChantierById)

// GET /api/chantiers/:id/stats - Statistiques d'un chantier
router.get('/:id/stats', getChantierStats)

// POST /api/chantiers - Créer un chantier (Admin seulement)
router.post('/', authorize('ADMIN'), createChantier)

// PUT /api/chantiers/:id - Modifier un chantier (Admin seulement)
router.put('/:id', authorize('ADMIN'), updateChantier)

// DELETE /api/chantiers/:id - Supprimer un chantier (Admin seulement)
router.delete('/:id', authorize('ADMIN'), deleteChantier)

export default router
