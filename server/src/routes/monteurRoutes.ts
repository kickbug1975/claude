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

/**
 * @swagger
 * /api/monteurs:
 *   get:
 *     summary: Liste des monteurs
 *     description: Retourne la liste de tous les monteurs (avec possibilité de filtrer)
 *     tags: [Monteurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: actif
 *         schema:
 *           type: boolean
 *         description: Filtrer par statut actif
 *     responses:
 *       200:
 *         description: Liste des monteurs récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 monteurs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Monteur'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', getAllMonteurs)

/**
 * @swagger
 * /api/monteurs/{id}:
 *   get:
 *     summary: Détails d'un monteur
 *     description: Retourne les informations détaillées d'un monteur spécifique
 *     tags: [Monteurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du monteur
 *     responses:
 *       200:
 *         description: Monteur trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 monteur:
 *                   $ref: '#/components/schemas/Monteur'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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
