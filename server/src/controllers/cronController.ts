import { Request, Response } from 'express'
import { listJobs, toggleJob, runJobManually } from '../services/cronService'
import { logger } from '../utils/logger'

/**
 * Lister tous les jobs cron
 */
export const getAllJobs = async (_req: Request, res: Response) => {
  try {
    const jobs = listJobs()

    return res.status(200).json({
      success: true,
      data: jobs,
    })
  } catch (error) {
    logger.error('Erreur liste jobs:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des jobs',
    })
  }
}

/**
 * Activer/Désactiver un job
 */
export const toggleJobStatus = async (req: Request, res: Response) => {
  try {
    const { name } = req.params
    const { enabled } = req.body

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Le champ "enabled" doit être un booléen',
      })
    }

    const success = toggleJob(name, enabled)

    if (!success) {
      return res.status(404).json({
        success: false,
        message: `Job "${name}" non trouvé`,
      })
    }

    return res.status(200).json({
      success: true,
      message: `Job "${name}" ${enabled ? 'activé' : 'désactivé'}`,
    })
  } catch (error) {
    logger.error('Erreur toggle job:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du job',
    })
  }
}

/**
 * Exécuter un job manuellement
 */
export const executeJob = async (req: Request, res: Response) => {
  try {
    const { name } = req.params

    const success = await runJobManually(name)

    if (!success) {
      return res.status(404).json({
        success: false,
        message: `Job "${name}" non trouvé`,
      })
    }

    return res.status(200).json({
      success: true,
      message: `Job "${name}" exécuté avec succès`,
    })
  } catch (error) {
    logger.error('Erreur exécution job:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'exécution du job',
    })
  }
}
