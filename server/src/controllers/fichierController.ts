import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { storageService, isS3Configured } from '../services/s3Service'
import { logger } from '../utils/logger'

/**
 * Upload un ou plusieurs fichiers
 */
export const uploadFiles = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[]
    const { feuilleId, description } = req.body

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni',
      })
    }

    // Vérifier que la feuille existe si feuilleId est fourni
    if (feuilleId) {
      const feuille = await prisma.feuilleTravail.findUnique({
        where: { id: feuilleId },
      })

      if (!feuille) {
        return res.status(404).json({
          success: false,
          message: 'Feuille de travail non trouvée',
        })
      }
    }

    // Upload des fichiers
    const uploadedFiles = await storageService.uploadMultiple(
      files.map((f) => ({
        buffer: f.buffer,
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
      })),
      feuilleId ? `feuilles/${feuilleId}` : 'documents'
    )

    // Enregistrer les fichiers en base de données
    const fichiers = await Promise.all(
      uploadedFiles.map((file) =>
        prisma.fichier.create({
          data: {
            nom: file.originalName,
            cle: file.key,
            url: file.url,
            mimeType: file.mimeType,
            taille: file.size,
            description: description || null,
            feuilleId: feuilleId || null,
          },
        })
      )
    )

    logger.info(`${fichiers.length} fichier(s) uploadé(s) avec succès`)

    return res.status(201).json({
      success: true,
      message: `${fichiers.length} fichier(s) uploadé(s) avec succès`,
      data: fichiers,
    })
  } catch (error) {
    logger.error('Erreur upload fichiers:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload des fichiers',
    })
  }
}

/**
 * Récupérer les fichiers d'une feuille de travail
 */
export const getFilesByFeuille = async (req: Request, res: Response) => {
  try {
    const { feuilleId } = req.params

    // Verify access to the feuille first
    const feuille = await prisma.feuilleTravail.findUnique({
      where: { id: feuilleId }
    })

    if (!feuille) {
      return res.status(404).json({
        success: false,
        message: 'Feuille de travail non trouvée',
      })
    }

    const fichiers = await prisma.fichier.findMany({
      where: { feuilleId },
      orderBy: { createdAt: 'desc' },
    })

    // Générer des URLs signées si S3 est configuré
    const fichiersAvecUrls = fichiers.map((f) => ({
      ...f,
      downloadUrl: storageService.getUrl(f.cle),
    }))

    return res.status(200).json({
      success: true,
      data: fichiersAvecUrls,
    })
  } catch (error) {
    logger.error('Erreur récupération fichiers:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des fichiers',
    })
  }
}

/**
 * Récupérer un fichier par son ID
 */
export const getFileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const fichier = await prisma.fichier.findUnique({
      where: { id },
      include: { feuille: true }
    })

    if (!fichier) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé',
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        ...fichier,
        downloadUrl: storageService.getUrl(fichier.cle),
      },
    })
  } catch (error) {
    logger.error('Erreur récupération fichier:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du fichier',
    })
  }
}

/**
 * Supprimer un fichier
 */
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const fichier = await prisma.fichier.findUnique({
      where: { id },
      include: { feuille: true }
    })

    if (!fichier) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé',
      })
    }

    // Supprimer du stockage (S3 ou local)
    await storageService.delete(fichier.cle)

    // Supprimer de la base de données
    await prisma.fichier.delete({
      where: { id },
    })

    logger.info(`Fichier supprimé: ${fichier.nom}`)

    return res.status(200).json({
      success: true,
      message: 'Fichier supprimé avec succès',
    })
  } catch (error) {
    logger.error('Erreur suppression fichier:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du fichier',
    })
  }
}

/**
 * Attacher un fichier existant à une feuille de travail
 */
export const attachFileToFeuille = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { feuilleId } = req.body

    // Vérifier que le fichier existe et appartient à l'entreprise (s'il est lié)
    const fichier = await prisma.fichier.findUnique({
      where: { id },
      include: { feuille: true }
    })

    if (!fichier) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé',
      })
    }

    // Vérifier que la feuille existe
    const feuille = await prisma.feuilleTravail.findUnique({
      where: { id: feuilleId },
    })

    if (!feuille) {
      return res.status(404).json({
        success: false,
        message: 'Feuille de travail non trouvée',
      })
    }

    // Mettre à jour le fichier
    const fichierMisAJour = await prisma.fichier.update({
      where: { id },
      data: { feuilleId },
    })

    return res.status(200).json({
      success: true,
      message: 'Fichier attaché à la feuille avec succès',
      data: fichierMisAJour,
    })
  } catch (error) {
    logger.error('Erreur attachement fichier:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'attachement du fichier',
    })
  }
}

/**
 * Obtenir les informations de configuration du stockage
 */
export const getStorageInfo = async (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: {
      storageType: isS3Configured() ? 'S3' : 'local',
      configured: isS3Configured(),
    },
  })
}
