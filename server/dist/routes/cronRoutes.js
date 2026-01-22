"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const cronController_1 = require("../controllers/cronController");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification ADMIN
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)('ADMIN'));
/**
 * @swagger
 * /api/cron:
 *   get:
 *     summary: Liste des jobs planifiés
 *     description: Retourne la liste de toutes les tâches planifiées et leur statut
 *     tags: [Cron]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des tâches récupérée
 */
router.get('/', cronController_1.getAllJobs);
/**
 * @swagger
 * /api/cron/{name}/toggle:
 *   patch:
 *     summary: Activer/Désactiver un job
 *     description: Permet de mettre en pause ou de relancer une tâche planifiée par son nom
 *     tags: [Cron]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Statut mis à jour
 */
router.patch('/:name/toggle', cronController_1.toggleJobStatus);
/**
 * @swagger
 * /api/cron/{name}/run:
 *   post:
 *     summary: Exécuter un job manuellement
 *     description: Déclenche l'exécution immédiate d'une tâche planifiée
 *     tags: [Cron]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tâche exécutée
 */
router.post('/:name/run', cronController_1.executeJob);
exports.default = router;
//# sourceMappingURL=cronRoutes.js.map