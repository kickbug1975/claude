import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { z } from 'zod'
import { logger } from '../utils/logger'
import { getPaginationParams, buildPaginatedResponse } from '../utils/pagination'

const monteurSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prénom requis'),
  telephone: z.string().min(1, 'Téléphone requis'),
  email: z.string().email('Email invalide'),
  adresse: z.string().min(1, 'Adresse requise'),
  dateEmbauche: z.string().transform((val) => new Date(val)),
  numeroIdentification: z.string().min(1, 'Numéro d\'identification requis'),
  actif: z.boolean().optional().default(true),
})

export const getAllMonteurs = async (req: Request, res: Response) => {
  try {
    const { actif } = req.query
    const { page, limit, skip } = getPaginationParams(req.query)

    const where = actif !== undefined ? { actif: actif === 'true' } : {}

    // Compter le total avec le même where
    const total = await prisma.monteur.count({ where })

    // Récupérer les monteurs paginés
    const monteurs = await prisma.monteur.findMany({
      where,
      orderBy: { nom: 'asc' },
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    })

    // Construire la réponse paginée
    const response = buildPaginatedResponse(monteurs, total, page, limit)

    return res.status(200).json({
      success: true,
      ...response,
    })
  } catch (error) {
    logger.error('Erreur getAllMonteurs', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const getMonteurById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const monteur = await prisma.monteur.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
        feuillesTravail: {
          take: 10,
          orderBy: { dateTravail: 'desc' },
          include: {
            chantier: { select: { nom: true, reference: true } },
          },
        },
      },
    })

    if (!monteur) {
      return res.status(404).json({
        success: false,
        message: 'Monteur non trouvé',
      })
    }

    return res.status(200).json({
      success: true,
      data: monteur,
    })
  } catch (error) {
    logger.error('Erreur getMonteurById', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const createMonteur = async (req: Request, res: Response) => {
  try {
    const validation = monteurSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: validation.error.flatten().fieldErrors,
      })
    }

    const data = validation.data

    // Vérifier si l'email existe déjà
    const existingEmail = await prisma.monteur.findUnique({
      where: { email: data.email },
    })

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Cet email est déjà utilisé',
      })
    }

    // Vérifier si le numéro d'identification existe déjà
    const existingNumero = await prisma.monteur.findUnique({
      where: { numeroIdentification: data.numeroIdentification },
    })

    if (existingNumero) {
      return res.status(409).json({
        success: false,
        message: 'Ce numéro d\'identification est déjà utilisé',
      })
    }

    const monteur = await prisma.monteur.create({
      data,
    })

    return res.status(201).json({
      success: true,
      message: 'Monteur créé avec succès',
      data: monteur,
    })
  } catch (error) {
    logger.error('Erreur createMonteur', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const updateMonteur = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const validation = monteurSchema.partial().safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: validation.error.flatten().fieldErrors,
      })
    }

    const existingMonteur = await prisma.monteur.findUnique({
      where: { id },
    })

    if (!existingMonteur) {
      return res.status(404).json({
        success: false,
        message: 'Monteur non trouvé',
      })
    }

    const monteur = await prisma.monteur.update({
      where: { id },
      data: validation.data,
    })

    return res.status(200).json({
      success: true,
      message: 'Monteur mis à jour avec succès',
      data: monteur,
    })
  } catch (error) {
    logger.error('Erreur updateMonteur', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const deleteMonteur = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const existingMonteur = await prisma.monteur.findUnique({
      where: { id },
    })

    if (!existingMonteur) {
      return res.status(404).json({
        success: false,
        message: 'Monteur non trouvé',
      })
    }

    await prisma.monteur.delete({
      where: { id },
    })

    return res.status(200).json({
      success: true,
      message: 'Monteur supprimé avec succès',
    })
  } catch (error) {
    logger.error('Erreur deleteMonteur', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const getMonteurStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { mois, annee } = req.query

    const year = annee ? parseInt(annee as string) : new Date().getFullYear()
    const month = mois ? parseInt(mois as string) : new Date().getMonth() + 1

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const stats = await prisma.feuilleTravail.aggregate({
      where: {
        monteurId: id,
        dateTravail: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { heuresTotales: true },
      _count: true,
    })

    const fraisTotal = await prisma.frais.aggregate({
      where: {
        feuille: {
          monteurId: id,
          dateTravail: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      _sum: { montant: true },
    })

    return res.status(200).json({
      success: true,
      data: {
        periode: { mois: month, annee: year },
        heuresTotal: stats._sum.heuresTotales || 0,
        nombreFeuilles: stats._count,
        fraisTotal: fraisTotal._sum.montant || 0,
      },
    })
  } catch (error) {
    logger.error('Erreur getMonteurStats', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}
