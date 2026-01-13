import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth'
import { getAllJobs, toggleJobStatus, executeJob } from '../controllers/cronController'

const router = Router()

// Toutes les routes nécessitent une authentification ADMIN
router.use(authenticate)
router.use(authorize('ADMIN'))

// GET /api/cron - Liste des jobs
router.get('/', getAllJobs)

// PATCH /api/cron/:name/toggle - Activer/Désactiver un job
router.patch('/:name/toggle', toggleJobStatus)

// POST /api/cron/:name/run - Exécuter un job manuellement
router.post('/:name/run', executeJob)

export default router
