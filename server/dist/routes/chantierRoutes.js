"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chantierController_1 = require("../controllers/chantierController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_1.authenticate);
/**
 * @swagger
 * /api/chantiers:
 *   get:
 *     summary: Liste des chantiers
 *     description: Retourne la liste de tous les chantiers (filtrable par statut actif)
 *     tags: [Chantiers]
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
 *         description: Liste des chantiers récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 chantiers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Chantier'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', chantierController_1.getAllChantiers);
/**
 * @swagger
 * /api/chantiers/{id}:
 *   get:
 *     summary: Détails d'un chantier
 *     description: Retourne les informations détaillées d'un chantier spécifique
 *     tags: [Chantiers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du chantier
 *     responses:
 *       200:
 *         description: Chantier trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 chantier:
 *                   $ref: '#/components/schemas/Chantier'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', chantierController_1.getChantierById);
/**
 * @swagger
 * /api/chantiers/{id}/stats:
 *   get:
 *     summary: Statistiques d'un chantier
 *     description: Retourne les statistiques d'utilisation (heures totales) pour un chantier spécifique
 *     tags: [Chantiers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du chantier
 *     responses:
 *       200:
 *         description: Statistiques récupérées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     heuresTotal:
 *                       type: number
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/stats', chantierController_1.getChantierStats);
/**
 * @swagger
 * /api/chantiers:
 *   post:
 *     summary: Créer un chantier
 *     description: Ajoute un nouveau chantier au système (Admin uniquement)
 *     tags: [Chantiers]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, reference, adresse, client, dateDebut]
 *             properties:
 *               nom: { type: string }
 *               reference: { type: string }
 *               adresse: { type: string }
 *               client: { type: string }
 *               description: { type: string }
 *               dateDebut: { type: string, format: date-time }
 *               dateFin: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Chantier créé
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/', (0, auth_1.authorize)('ADMIN'), chantierController_1.createChantier);
/**
 * @swagger
 * /api/chantiers/{id}:
 *   put:
 *     summary: Modifier un chantier
 *     description: Met à jour les informations d'un chantier existant (Admin uniquement)
 *     tags: [Chantiers]
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
 *           schema: { $ref: '#/components/schemas/Chantier' }
 *     responses:
 *       200:
 *         description: Chantier mis à jour
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put('/:id', (0, auth_1.authorize)('ADMIN'), chantierController_1.updateChantier);
/**
 * @swagger
 * /api/chantiers/{id}:
 *   delete:
 *     summary: Supprimer un chantier
 *     description: Supprime un chantier du système (Admin uniquement)
 *     tags: [Chantiers]
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
 *         description: Chantier supprimé
 */
router.delete('/:id', (0, auth_1.authorize)('ADMIN'), chantierController_1.deleteChantier);
exports.default = router;
//# sourceMappingURL=chantierRoutes.js.map