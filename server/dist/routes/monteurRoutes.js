"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const monteurController_1 = require("../controllers/monteurController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_1.authenticate);
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
router.get('/', monteurController_1.getAllMonteurs);
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
router.get('/:id', monteurController_1.getMonteurById);
/**
 * @swagger
 * /api/monteurs/{id}/stats:
 *   get:
 *     summary: Statistiques d'un monteur
 *     description: Retourne les statistiques d'activité (heures totales) pour un monteur spécifique
 *     tags: [Monteurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID du monteur
 *     responses:
 *       200:
 *         description: Statistiques récupérées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     heuresTotal: { type: number }
 */
router.get('/:id/stats', monteurController_1.getMonteurStats);
/**
 * @swagger
 * /api/monteurs:
 *   post:
 *     summary: Créer un monteur
 *     description: Ajoute un nouveau monteur au système (Admin uniquement)
 *     tags: [Monteurs]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, prenom, email, telephone, adresse, dateEmbauche, numeroIdentification]
 *             properties:
 *               nom: { type: string }
 *               prenom: { type: string }
 *               email: { type: string, format: email }
 *               telephone: { type: string }
 *               adresse: { type: string }
 *               dateEmbauche: { type: string, format: date-time }
 *               numeroIdentification: { type: string }
 *     responses:
 *       201:
 *         description: Monteur créé
 */
router.post('/', (0, auth_1.authorize)('ADMIN'), monteurController_1.createMonteur);
/**
 * @swagger
 * /api/monteurs/{id}:
 *   put:
 *     summary: Modifier un monteur
 *     description: Met à jour les informations d'un monteur existant (Admin uniquement)
 *     tags: [Monteurs]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Monteur' }
 *     responses:
 *       200:
 *         description: Monteur mis à jour
 */
router.put('/:id', (0, auth_1.authorize)('ADMIN'), monteurController_1.updateMonteur);
/**
 * @swagger
 * /api/monteurs/{id}:
 *   delete:
 *     summary: Supprimer un monteur
 *     description: Supprime un monteur du système (Admin uniquement)
 *     tags: [Monteurs]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Monteur supprimé
 */
router.delete('/:id', (0, auth_1.authorize)('ADMIN'), monteurController_1.deleteMonteur);
exports.default = router;
//# sourceMappingURL=monteurRoutes.js.map