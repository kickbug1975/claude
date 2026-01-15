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

/**
 * @swagger
 * /api/feuilles:
 *   get:
 *     summary: Liste des feuilles de travail
 *     description: Retourne les feuilles de l'utilisateur (monteur) ou toutes les feuilles (admin)
 *     tags: [Feuilles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste récupérée
 */
router.get('/', getAllFeuilles)

/**
 * @swagger
 * /api/feuilles/{id}:
 *   get:
 *     summary: Détails d'une feuille
 *     tags: [Feuilles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Détails de la feuille
 */
router.get('/:id', getFeuilleById)

/**
 * @swagger
 * /api/feuilles:
 *   post:
 *     summary: Créer une feuille de travail
 *     tags: [Feuilles]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [monteurId, chantierId, dateTravail, heureDebut, heureFin, descriptionTravail]
 *             properties:
 *               monteurId: { type: string, format: uuid }
 *               chantierId: { type: string, format: uuid }
 *               dateTravail: { type: string, format: date-time }
 *               heureDebut: { type: string, example: "08:00" }
 *               heureFin: { type: string, example: "17:00" }
 *               descriptionTravail: { type: string }
 *     responses:
 *       201:
 *         description: Feuille créée
 */
router.post('/', createFeuille)

/**
 * @swagger
 * /api/feuilles/{id}:
 *   put:
 *     summary: Modifier une feuille
 *     tags: [Feuilles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/FeuilleTravail' }
 *     responses:
 *       200:
 *         description: Feuille mise à jour
 */
router.put('/:id', updateFeuille)

/**
 * @swagger
 * /api/feuilles/{id}:
 *   delete:
 *     summary: Supprimer une feuille
 *     tags: [Feuilles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Feuille supprimée
 */
router.delete('/:id', deleteFeuille)

/**
 * @swagger
 * /api/feuilles/{id}/submit:
 *   post:
 *     summary: Soumettre une feuille
 *     description: Change le statut de BROUILLON à SOUMIS pour validation
 *     tags: [Feuilles]
 *     responses:
 *       200:
 *         description: Feuille soumise
 */
router.post('/:id/submit', submitFeuille)

/**
 * @swagger
 * /api/feuilles/{id}/validate:
 *   post:
 *     summary: Valider une feuille
 *     description: Approuve la feuille (Admin/Superviseur uniquement)
 *     tags: [Feuilles]
 *     responses:
 *       200:
 *         description: Feuille validée
 */
router.post('/:id/validate', authorize('ADMIN', 'SUPERVISEUR'), validateFeuille)

/**
 * @swagger
 * /api/feuilles/{id}/reject:
 *   post:
 *     summary: Rejeter une feuille
 *     description: Refuse la feuille avec un motif (Admin/Superviseur uniquement)
 *     tags: [Feuilles]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commentaire: { type: string }
 *     responses:
 *       200:
 *         description: Feuille rejetée
 */
router.post('/:id/reject', authorize('ADMIN', 'SUPERVISEUR'), rejectFeuille)

/**
 * @swagger
 * /api/feuilles/{id}/frais:
 *   post:
 *     summary: Ajouter un frais
 *     tags: [Feuilles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [typeFrais, montant, description]
 *             properties:
 *               typeFrais: { type: string, enum: [TRANSPORT, MATERIEL, REPAS, AUTRES] }
 *               montant: { type: number }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Frais ajouté
 */
router.post('/:id/frais', addFrais)

/**
 * @swagger
 * /api/feuilles/{id}/frais/{fraisId}:
 *   delete:
 *     summary: Supprimer un frais
 *     tags: [Feuilles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: fraisId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Frais supprimé
 */
router.delete('/:id/frais/:fraisId', deleteFrais)

export default router
