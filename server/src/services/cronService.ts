import cron from 'node-cron'
import { prisma } from '../config/database'
import { logger } from '../utils/logger'
import { storageService } from './s3Service'
import { cleanExpiredRefreshTokens } from '../utils/refreshToken'
// import { emailService } from './emailService' // Pour utilisation future

// =====================================================
// Configuration des tâches planifiées
// =====================================================

interface CronJob {
  name: string
  schedule: string
  task: () => Promise<void>
  enabled: boolean
}

// Liste des jobs
const jobs: CronJob[] = []

/**
 * Enregistrer un job cron
 */
const registerJob = (job: CronJob) => {
  jobs.push(job)
}

/**
 * Démarrer tous les jobs cron
 */
export const startCronJobs = () => {
  logger.info('Démarrage des tâches planifiées...')

  jobs.forEach((job) => {
    if (job.enabled) {
      cron.schedule(job.schedule, async () => {
        logger.info(`[CRON] Exécution: ${job.name}`)
        const startTime = Date.now()

        try {
          await job.task()
          const duration = Date.now() - startTime
          logger.success(`[CRON] ${job.name} terminé en ${duration}ms`)
        } catch (error) {
          logger.error(`[CRON] Erreur ${job.name}:`, error)
        }
      })
      logger.info(`[CRON] Job enregistré: ${job.name} (${job.schedule})`)
    }
  })

  logger.success(`${jobs.filter((j) => j.enabled).length} tâche(s) planifiée(s) démarrée(s)`)
}

// =====================================================
// JOB 1: Rappel pour feuilles en brouillon
// Exécution: Tous les jours à 9h00
// =====================================================
registerJob({
  name: 'Rappel feuilles brouillon',
  schedule: '0 9 * * *', // Tous les jours à 9h00
  enabled: true,
  task: async () => {
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const feuillesBrouillon = await prisma.feuilleTravail.findMany({
      where: {
        statut: 'BROUILLON',
        updatedAt: {
          lt: oneDayAgo,
        },
      },
      include: {
        monteur: true,
      },
    })

    if (feuillesBrouillon.length > 0) {
      logger.info(`[CRON] ${feuillesBrouillon.length} feuille(s) en brouillon trouvée(s)`)
      for (const feuille of feuillesBrouillon) {
        logger.info(
          `[CRON] Rappel: Feuille ${feuille.id.substring(0, 8)} - ${feuille.monteur.prenom} ${feuille.monteur.nom}`
        )
      }
    }
  },
})

// =====================================================
// JOB 2: Rappel pour feuilles en attente de validation
// Exécution: Tous les jours à 10h00
// =====================================================
registerJob({
  name: 'Rappel feuilles en attente',
  schedule: '0 10 * * *', // Tous les jours à 10h00
  enabled: true,
  task: async () => {
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    const feuillesEnAttente = await prisma.feuilleTravail.findMany({
      where: {
        statut: 'SOUMIS',
        updatedAt: {
          lt: twoDaysAgo,
        },
      },
      include: {
        monteur: true,
      },
    })

    if (feuillesEnAttente.length > 0) {
      const superviseurs = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPERVISEUR'] },
        },
        select: { email: true },
      })

      logger.info(
        `[CRON] ${feuillesEnAttente.length} feuille(s) en attente - ${superviseurs.length} superviseur(s) à notifier`
      )
    }
  },
})

// =====================================================
// JOB 3: Nettoyage des fichiers orphelins
// Exécution: Tous les dimanches à 3h00
// =====================================================
registerJob({
  name: 'Nettoyage fichiers orphelins',
  schedule: '0 3 * * 0', // Tous les dimanches à 3h00
  enabled: true,
  task: async () => {
    // Trouver les fichiers sans feuille associée et créés il y a plus de 7 jours
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const fichiersOrphelins = await prisma.fichier.findMany({
      where: {
        feuilleId: null,
        createdAt: {
          lt: sevenDaysAgo,
        },
      },
    })

    logger.info(`[CRON] ${fichiersOrphelins.length} fichier(s) orphelin(s) trouvé(s)`)

    // Supprimer les fichiers orphelins
    for (const fichier of fichiersOrphelins) {
      try {
        await storageService.delete(fichier.cle)
        await prisma.fichier.delete({ where: { id: fichier.id } })
        logger.info(`[CRON] Fichier orphelin supprimé: ${fichier.nom}`)
      } catch (error) {
        logger.error(`[CRON] Erreur suppression fichier ${fichier.id}:`, error)
      }
    }

    if (fichiersOrphelins.length > 0) {
      logger.success(`[CRON] ${fichiersOrphelins.length} fichier(s) orphelin(s) supprimé(s)`)
    }
  },
})

// =====================================================
// JOB 4: Nettoyage des refresh tokens expirés
// Exécution: Tous les jours à 2h00
// =====================================================
registerJob({
  name: 'Nettoyage refresh tokens expirés',
  schedule: '0 2 * * *', // Tous les jours à 2h00
  enabled: true,
  task: async () => {
    const deletedCount = await cleanExpiredRefreshTokens()
    logger.info(`[CRON] ${deletedCount} refresh token(s) expiré(s) supprimé(s)`)
  },
})

// =====================================================
// JOB 5: Génération de statistiques quotidiennes
// Exécution: Tous les jours à 23h55
// =====================================================
registerJob({
  name: 'Statistiques quotidiennes',
  schedule: '55 23 * * *', // Tous les jours à 23h55
  enabled: true,
  task: async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const stats = await prisma.feuilleTravail.groupBy({
      by: ['statut'],
      where: {
        createdAt: { gte: today, lt: tomorrow },
      },
      _count: true,
    })

    const heuresTotal = await prisma.feuilleTravail.aggregate({
      where: {
        dateTravail: { gte: today, lt: tomorrow },
        statut: 'VALIDE',
      },
      _sum: { heuresTotales: true },
    })

    const nouveauxMonteurs = await prisma.monteur.count({
      where: {
        createdAt: { gte: today, lt: tomorrow },
      },
    })

    if (stats.length > 0 || nouveauxMonteurs > 0) {
      logger.info(`[CRON] === Statistiques du jour ===`)
      logger.info(`[CRON] Feuilles créées: ${stats.reduce((acc, s) => acc + s._count, 0)}`)
      stats.forEach((s) => {
        logger.info(`[CRON]   - ${s.statut}: ${s._count}`)
      })
      logger.info(`[CRON] Heures validées: ${heuresTotal._sum.heuresTotales || 0}h`)
      logger.info(`[CRON] Nouveaux monteurs: ${nouveauxMonteurs}`)
    }
  },
})

// =====================================================
// JOB 5: Rapport hebdomadaire
// Exécution: Tous les lundis à 8h00
// =====================================================
registerJob({
  name: 'Rapport hebdomadaire',
  schedule: '0 8 * * 1', // Tous les lundis à 8h00
  enabled: true,
  task: async () => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const feuillesValidees = await prisma.feuilleTravail.count({
      where: {
        statut: 'VALIDE',
        updatedAt: { gte: oneWeekAgo },
      },
    })

    const feuillesRejetees = await prisma.feuilleTravail.count({
      where: {
        statut: 'REJETE',
        updatedAt: { gte: oneWeekAgo },
      },
    })

    const heuresTotal = await prisma.feuilleTravail.aggregate({
      where: {
        statut: 'VALIDE',
        dateTravail: { gte: oneWeekAgo },
      },
      _sum: { heuresTotales: true },
    })

    const fraisTotal = await prisma.frais.aggregate({
      where: {
        feuille: {
          statut: 'VALIDE',
          dateTravail: { gte: oneWeekAgo },
        },
      },
      _sum: { montant: true },
    })

    const topMonteurs = await prisma.feuilleTravail.groupBy({
      by: ['monteurId'],
      where: {
        statut: 'VALIDE',
        dateTravail: { gte: oneWeekAgo },
      },
      _sum: { heuresTotales: true },
      orderBy: { _sum: { heuresTotales: 'desc' } },
      take: 5,
    })

    if (feuillesValidees > 0 || feuillesRejetees > 0) {
      logger.info(`[CRON] === Rapport Hebdomadaire ===`)
      logger.info(`[CRON] Période: ${oneWeekAgo.toLocaleDateString('fr-FR')} - ${new Date().toLocaleDateString('fr-FR')}`)
      logger.info(`[CRON] Feuilles validées: ${feuillesValidees}`)
      logger.info(`[CRON] Feuilles rejetées: ${feuillesRejetees}`)
      logger.info(`[CRON] Heures totales: ${heuresTotal._sum.heuresTotales || 0}h`)
      logger.info(`[CRON] Frais totaux: ${(fraisTotal._sum.montant || 0).toFixed(2)} EUR`)
      logger.info(`[CRON] Top ${topMonteurs.length} monteurs cette semaine`)
    }
  },
})

// =====================================================
// Utilitaires
// =====================================================

/**
 * Lister tous les jobs enregistrés
 */
export const listJobs = () => {
  return jobs.map((job) => ({
    name: job.name,
    schedule: job.schedule,
    enabled: job.enabled,
  }))
}

/**
 * Activer/Désactiver un job
 */
export const toggleJob = (name: string, enabled: boolean) => {
  const job = jobs.find((j) => j.name === name)
  if (job) {
    job.enabled = enabled
    logger.info(`[CRON] Job "${name}" ${enabled ? 'activé' : 'désactivé'}`)
    return true
  }
  return false
}

/**
 * Exécuter un job manuellement
 */
export const runJobManually = async (name: string) => {
  const job = jobs.find((j) => j.name === name)
  if (job) {
    logger.info(`[CRON] Exécution manuelle: ${name}`)
    try {
      await job.task()
      return true
    } catch (error) {
      logger.error(`[CRON] Erreur exécution manuelle ${name}:`, error)
      return true // On retourne true car le job a été trouvé et tenté
    }
  }
  return false
}

/**
 * Réinitialiser l'état des jobs (pour les tests)
 */
export const resetJobsState = () => {
  jobs.forEach((j) => {
    j.enabled = true
  })
}

export default {
  startCronJobs,
  listJobs,
  toggleJob,
  runJobManually,
}
