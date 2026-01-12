import { Router } from 'express'
import {
  getAllFeuilles,
  getFeuilleById,
  createFeuille,
  updateFeuille,
  deleteFeuille,
  submitFeuille,
  validateFeuille,
  rejectFeuille,
  addFrais,
  deleteFrais,
} from '../controllers/feuilleController'
import { authenticate, authorize } from '../middlewares/auth'

const router = Router()

// Toutes les routes nécessitent une authentification
router.use(authenticate)

// GET /api/feuilles - Liste des feuilles
router.get('/', getAllFeuilles)

// GET /api/feuilles/:id - Détails d'une feuille
router.get('/:id', getFeuilleById)

// POST /api/feuilles - Créer une feuille
router.post('/', createFeuille)

// PUT /api/feuilles/:id - Modifier une feuille
router.put('/:id', updateFeuille)

// DELETE /api/feuilles/:id - Supprimer une feuille
router.delete('/:id', deleteFeuille)

// POST /api/feuilles/:id/submit - Soumettre une feuille
router.post('/:id/submit', submitFeuille)

// POST /api/feuilles/:id/validate - Valider une feuille (Superviseur/Admin)
router.post('/:id/validate', authorize('ADMIN', 'SUPERVISEUR'), validateFeuille)

// POST /api/feuilles/:id/reject - Rejeter une feuille (Superviseur/Admin)
router.post('/:id/reject', authorize('ADMIN', 'SUPERVISEUR'), rejectFeuille)

// POST /api/feuilles/:id/frais - Ajouter un frais
router.post('/:id/frais', addFrais)

// DELETE /api/feuilles/:id/frais/:fraisId - Supprimer un frais
router.delete('/:id/frais/:fraisId', deleteFrais)

export default router
