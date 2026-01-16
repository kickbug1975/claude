import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { z } from 'zod'
import { emailService, FeuilleEmailData } from '../services/emailService'
import { logger } from '../utils/logger'
import { getPaginationParams, buildPaginatedResponse } from '../utils/pagination'

const fraisSchema = z.object({
  typeFrais: z.enum(['TRANSPORT', 'MATERIEL', 'REPAS', 'AUTRES']),
  montant: z.number().positive('Le montant doit être positif'),
  description: z.string().min(1, 'Description requise'),
  fichierProuve: z.string().optional(),
})

const feuilleSchema = z.object({
  monteurId: z.string().uuid('ID monteur invalide'),
  chantierId: z.string().uuid('ID chantier invalide'),
  dateTravail: z.string().transform((val) => new Date(val)),
  heureDebut: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format heure invalide (HH:mm)'),
  heureFin: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format heure invalide (HH:mm)'),
  descriptionTravail: z.string().min(1, 'Description du travail requise'),
  frais: z.array(fraisSchema).optional(),
})

const calculateHours = (heureDebut: string, heureFin: string): number => {
  const [startH, startM] = heureDebut.split(':').map(Number)
  const [endH, endM] = heureFin.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  return (endMinutes - startMinutes) / 60
}

export const getAllFeuilles = async (req: Request, res: Response) => {
  try {
    const { statut, monteurId, chantierId, dateDebut, dateFin } = req.query
    const { page, limit, skip } = getPaginationParams(req.query)
    const user = req.user!

    const where: any = {}

    // Filtrer par monteur si l'utilisateur est un monteur
    if (user.role === 'MONTEUR') {
      const userWithMonteur = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { monteurId: true },
      })
      if (userWithMonteur?.monteurId) {
        where.monteurId = userWithMonteur.monteurId
      }
    } else if (monteurId) {
      where.monteurId = monteurId
    }

    if (statut) where.statut = statut
    if (chantierId) where.chantierId = chantierId
    if (dateDebut || dateFin) {
      where.dateTravail = {}
      if (dateDebut) where.dateTravail.gte = new Date(dateDebut as string)
      if (dateFin) where.dateTravail.lte = new Date(dateFin as string)
    }

    // Compter le total avec le même where
    const total = await prisma.feuilleTravail.count({ where })

    // Récupérer les feuilles paginées
    const feuilles = await prisma.feuilleTravail.findMany({
      where,
      orderBy: { dateTravail: 'desc' },
      skip,
      take: limit,
      include: {
        monteur: { select: { nom: true, prenom: true, numeroIdentification: true } },
        chantier: { select: { nom: true, reference: true } },
        frais: true,
        validePar: { select: { email: true } },
      },
    })

    // Construire la réponse paginée
    const response = buildPaginatedResponse(feuilles, total, page, limit)

    return res.status(200).json({
      success: true,
      ...response,
    })
  } catch (error) {
    logger.error('Erreur getAllFeuilles', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const getFeuilleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const feuille = await prisma.feuilleTravail.findUnique({
      where: {
        id
      },
      include: {
        monteur: true,
        chantier: true,
        frais: true,
        fichiers: true,
        validePar: { select: { email: true, role: true } },
      },
    })

    if (!feuille) {
      return res.status(404).json({
        success: false,
        message: 'Feuille de travail non trouvée',
      })
    }

    return res.status(200).json({
      success: true,
      data: feuille,
    })
  } catch (error) {
    logger.error('Erreur getFeuilleById', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const createFeuille = async (req: Request, res: Response) => {
  try {
    const validation = feuilleSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: validation.error.flatten().fieldErrors,
      })
    }

    const { frais, ...feuilleData } = validation.data

    // Calculer les heures totales
    const heuresTotales = calculateHours(feuilleData.heureDebut, feuilleData.heureFin)

    if (heuresTotales <= 0) {
      return res.status(400).json({
        success: false,
        message: 'L\'heure de fin doit être après l\'heure de début',
      })
    }

    // Vérifier que le monteur existe
    const monteur = await prisma.monteur.findUnique({
      where: { id: feuilleData.monteurId },
    })

    if (!monteur) {
      return res.status(404).json({
        success: false,
        message: 'Monteur non trouvé',
      })
    }

    // Vérifier que le chantier existe
    const chantier = await prisma.chantier.findUnique({
      where: { id: feuilleData.chantierId },
    })

    if (!chantier) {
      return res.status(404).json({
        success: false,
        message: 'Chantier non trouvé',
      })
    }

    const feuille = await prisma.feuilleTravail.create({
      data: {
        ...feuilleData,
        heuresTotales,
        frais: frais ? {
          create: frais,
        } : undefined,
      },
      include: {
        monteur: { select: { nom: true, prenom: true } },
        chantier: { select: { nom: true, reference: true } },
        frais: true,
      },
    })

    return res.status(201).json({
      success: true,
      message: 'Feuille de travail créée avec succès',
      data: feuille,
    })
  } catch (error) {
    logger.error('Erreur createFeuille', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const updateFeuille = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const validation = feuilleSchema.partial().safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: validation.error.flatten().fieldErrors,
      })
    }

    const existingFeuille = await prisma.feuilleTravail.findUnique({
      where: {
        id
      },
    })

    if (!existingFeuille) {
      return res.status(404).json({
        success: false,
        message: 'Feuille de travail non trouvée',
      })
    }

    // Empêcher la modification si la feuille est validée
    if (existingFeuille.statut === 'VALIDE') {
      return res.status(403).json({
        success: false,
        message: 'Impossible de modifier une feuille validée',
      })
    }

    const { frais, ...feuilleData } = validation.data

    // Recalculer les heures si nécessaire
    let heuresTotales = existingFeuille.heuresTotales
    if (feuilleData.heureDebut || feuilleData.heureFin) {
      const heureDebut = feuilleData.heureDebut || existingFeuille.heureDebut
      const heureFin = feuilleData.heureFin || existingFeuille.heureFin
      heuresTotales = calculateHours(heureDebut, heureFin)
    }

    const feuille = await prisma.feuilleTravail.update({
      where: { id },
      data: {
        ...feuilleData,
        heuresTotales,
      },
      include: {
        monteur: { select: { nom: true, prenom: true } },
        chantier: { select: { nom: true, reference: true } },
        frais: true,
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Feuille de travail mise à jour avec succès',
      data: feuille,
    })
  } catch (error) {
    logger.error('Erreur updateFeuille', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const deleteFeuille = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const existingFeuille = await prisma.feuilleTravail.findUnique({
      where: {
        id
      },
    })

    if (!existingFeuille) {
      return res.status(404).json({
        success: false,
        message: 'Feuille de travail non trouvée',
      })
    }

    await prisma.feuilleTravail.delete({
      where: { id },
    })

    return res.status(200).json({
      success: true,
      message: 'Feuille de travail supprimée avec succès',
    })
  } catch (error) {
    logger.error('Erreur deleteFeuille', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const submitFeuille = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const feuille = await prisma.feuilleTravail.findUnique({
      where: {
        id
      },
      include: {
        monteur: true,
        chantier: true,
        frais: true,
      },
    })

    if (!feuille) {
      return res.status(404).json({
        success: false,
        message: 'Feuille de travail non trouvée',
      })
    }

    if (feuille.statut !== 'BROUILLON') {
      return res.status(400).json({
        success: false,
        message: 'Seules les feuilles en brouillon peuvent être soumises',
      })
    }

    const updatedFeuille = await prisma.feuilleTravail.update({
      where: { id },
      data: { statut: 'SOUMIS' },
      include: {
        monteur: { select: { nom: true, prenom: true } },
        chantier: { select: { nom: true, reference: true } },
      },
    })

    // Envoi des notifications email
    try {
      const totalFrais = feuille.frais.reduce((acc: number, f: { montant: number }) => acc + f.montant, 0)
      const emailData: FeuilleEmailData = {
        id: feuille.id,
        monteurNom: feuille.monteur.nom,
        monteurPrenom: feuille.monteur.prenom,
        monteurEmail: feuille.monteur.email,
        chantierNom: feuille.chantier.nom,
        chantierReference: feuille.chantier.reference,
        dateTravail: feuille.dateTravail,
        heureDebut: feuille.heureDebut,
        heureFin: feuille.heureFin,
        heuresTotales: feuille.heuresTotales,
        descriptionTravail: feuille.descriptionTravail,
        totalFrais: totalFrais > 0 ? totalFrais : undefined,
      }

      // Recuperer les superviseurs et admins
      const superviseurs = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPERVISEUR'] } },
        select: { email: true },
      })

      await emailService.notifySubmission(emailData, superviseurs)
    } catch (emailError) {
      logger.error('Erreur envoi email soumission', emailError instanceof Error ? emailError : undefined)
      // On ne bloque pas la soumission si l'email echoue
    }

    return res.status(200).json({
      success: true,
      message: 'Feuille de travail soumise avec succès',
      data: updatedFeuille,
    })
  } catch (error) {
    logger.error('Erreur submitFeuille', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const validateFeuille = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const user = req.user!

    const feuille = await prisma.feuilleTravail.findUnique({
      where: {
        id
      },
      include: {
        monteur: true,
        chantier: true,
      },
    })

    if (!feuille) {
      return res.status(404).json({
        success: false,
        message: 'Feuille de travail non trouvée',
      })
    }

    if (feuille.statut !== 'SOUMIS') {
      return res.status(400).json({
        success: false,
        message: 'Seules les feuilles soumises peuvent être validées',
      })
    }

    const updatedFeuille = await prisma.feuilleTravail.update({
      where: { id },
      data: {
        statut: 'VALIDE',
        valideParId: user.userId,
      },
      include: {
        monteur: { select: { nom: true, prenom: true } },
        chantier: { select: { nom: true, reference: true } },
        validePar: { select: { email: true } },
      },
    })

    // Envoi de la notification email au monteur
    try {
      const validateur = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { email: true },
      })

      const emailData: FeuilleEmailData = {
        id: feuille.id,
        monteurNom: feuille.monteur.nom,
        monteurPrenom: feuille.monteur.prenom,
        monteurEmail: feuille.monteur.email,
        chantierNom: feuille.chantier.nom,
        chantierReference: feuille.chantier.reference,
        dateTravail: feuille.dateTravail,
        heureDebut: feuille.heureDebut,
        heureFin: feuille.heureFin,
        heuresTotales: feuille.heuresTotales,
        descriptionTravail: feuille.descriptionTravail,
      }

      await emailService.notifyValidation(emailData, validateur?.email || 'Superviseur')
    } catch (emailError) {
      logger.error('Erreur envoi email validation', emailError instanceof Error ? emailError : undefined)
    }

    return res.status(200).json({
      success: true,
      message: 'Feuille de travail validée avec succès',
      data: updatedFeuille,
    })
  } catch (error) {
    logger.error('Erreur validateFeuille', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const rejectFeuille = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { motif } = req.body // Motif optionnel de rejet
    const user = req.user!

    const feuille = await prisma.feuilleTravail.findUnique({
      where: {
        id
      },
      include: {
        monteur: true,
        chantier: true,
      },
    })

    if (!feuille) {
      return res.status(404).json({
        success: false,
        message: 'Feuille de travail non trouvée',
      })
    }

    if (feuille.statut !== 'SOUMIS') {
      return res.status(400).json({
        success: false,
        message: 'Seules les feuilles soumises peuvent être rejetées',
      })
    }

    const updatedFeuille = await prisma.feuilleTravail.update({
      where: { id },
      data: {
        statut: 'REJETE',
        valideParId: user.userId,
      },
      include: {
        monteur: { select: { nom: true, prenom: true } },
        chantier: { select: { nom: true, reference: true } },
        validePar: { select: { email: true } },
      },
    })

    // Envoi de la notification email au monteur
    try {
      const rejeteur = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { email: true },
      })

      const emailData: FeuilleEmailData = {
        id: feuille.id,
        monteurNom: feuille.monteur.nom,
        monteurPrenom: feuille.monteur.prenom,
        monteurEmail: feuille.monteur.email,
        chantierNom: feuille.chantier.nom,
        chantierReference: feuille.chantier.reference,
        dateTravail: feuille.dateTravail,
        heureDebut: feuille.heureDebut,
        heureFin: feuille.heureFin,
        heuresTotales: feuille.heuresTotales,
        descriptionTravail: feuille.descriptionTravail,
      }

      await emailService.notifyRejection(emailData, rejeteur?.email || 'Superviseur', motif)
    } catch (emailError) {
      logger.error('Erreur envoi email rejet', emailError instanceof Error ? emailError : undefined)
    }

    return res.status(200).json({
      success: true,
      message: 'Feuille de travail rejetée',
      data: updatedFeuille,
    })
  } catch (error) {
    logger.error('Erreur rejectFeuille', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

// Gestion des frais
export const addFrais = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const validation = fraisSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: validation.error.flatten().fieldErrors,
      })
    }

    const feuille = await prisma.feuilleTravail.findUnique({
      where: {
        id
      },
    })

    if (!feuille) {
      return res.status(404).json({
        success: false,
        message: 'Feuille de travail non trouvée',
      })
    }

    if (feuille.statut === 'VALIDE') {
      return res.status(403).json({
        success: false,
        message: 'Impossible d\'ajouter des frais à une feuille validée',
      })
    }

    const frais = await prisma.frais.create({
      data: {
        ...validation.data,
        feuilleId: id,
      },
    })

    return res.status(201).json({
      success: true,
      message: 'Frais ajouté avec succès',
      data: frais,
    })
  } catch (error) {
    logger.error('Erreur addFrais', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const deleteFrais = async (req: Request, res: Response) => {
  try {
    const { fraisId } = req.params

    const frais = await prisma.frais.findUnique({
      where: { id: fraisId },
      include: { feuille: true },
    })

    if (!frais) {
      return res.status(404).json({
        success: false,
        message: 'Frais non trouvé',
      })
    }

    if (frais.feuille.statut === 'VALIDE') {
      return res.status(403).json({
        success: false,
        message: 'Impossible de supprimer les frais d\'une feuille validée',
      })
    }

    await prisma.frais.delete({
      where: { id: fraisId },
    })

    return res.status(200).json({
      success: true,
      message: 'Frais supprimé avec succès',
    })
  } catch (error) {
    logger.error('Erreur deleteFrais', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}
