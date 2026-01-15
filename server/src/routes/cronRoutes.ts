import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth'
import { getAllJobs, toggleJobStatus, executeJob } from '../controllers/cronController'

const router = Router()

// Toutes les routes nécessitent une authentification ADMIN
router.use(authenticate)
router.use(authorize('ADMIN'))

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
router.get('/', getAllJobs)

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
router.patch('/:name/toggle', toggleJobStatus)

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
router.post('/:name/run', executeJob)

export default router
