import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { z } from 'zod'
import { logger } from '../utils/logger'
import { getPaginationParams, buildPaginatedResponse } from '../utils/pagination'

const chantierSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  adresse: z.string().min(1, 'Adresse requise'),
  client: z.string().min(1, 'Client requis'),
  reference: z.string().min(1, 'Référence requise'),
  dateDebut: z.string().transform((val) => new Date(val)),
  dateFin: z.string().transform((val) => new Date(val)).optional().nullable(),
  description: z.string().min(1, 'Description requise'),
  actif: z.boolean().optional().default(true),
})

export const getAllChantiers = async (req: Request, res: Response) => {
  try {
    const { actif } = req.query
    const { page, limit, skip } = getPaginationParams(req.query)

    const where = actif !== undefined ? { actif: actif === 'true' } : {}

    // Compter le total avec le même where
    const total = await prisma.chantier.count({ where })

    // Récupérer les chantiers paginés
    const chantiers = await prisma.chantier.findMany({
      where,
      orderBy: { dateDebut: 'desc' },
      skip,
      take: limit,
    })

    // Construire la réponse paginée
    const response = buildPaginatedResponse(chantiers, total, page, limit)

    return res.status(200).json({
      success: true,
      ...response,
    })
  } catch (error) {
    logger.error('Erreur getAllChantiers', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const getChantierById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const chantier = await prisma.chantier.findUnique({
      where: { id },
      include: {
        feuillesTravail: {
          take: 10,
          orderBy: { dateTravail: 'desc' },
          include: {
            monteur: { select: { nom: true, prenom: true } },
          },
        },
      },
    })

    if (!chantier) {
      return res.status(404).json({
        success: false,
        message: 'Chantier non trouvé',
      })
    }

    return res.status(200).json({
      success: true,
      data: chantier,
    })
  } catch (error) {
    logger.error('Erreur getChantierById', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const createChantier = async (req: Request, res: Response) => {
  try {
    const validation = chantierSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: validation.error.flatten().fieldErrors,
      })
    }

    const data = validation.data

    // Vérifier si la référence existe déjà
    const existingRef = await prisma.chantier.findUnique({
      where: { reference: data.reference },
    })

    if (existingRef) {
      return res.status(409).json({
        success: false,
        message: 'Cette référence est déjà utilisée',
      })
    }

    const chantier = await prisma.chantier.create({
      data,
    })

    return res.status(201).json({
      success: true,
      message: 'Chantier créé avec succès',
      data: chantier,
    })
  } catch (error) {
    logger.error('Erreur createChantier', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const updateChantier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const validation = chantierSchema.partial().safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: validation.error.flatten().fieldErrors,
      })
    }

    const existingChantier = await prisma.chantier.findUnique({
      where: { id },
    })

    if (!existingChantier) {
      return res.status(404).json({
        success: false,
        message: 'Chantier non trouvé',
      })
    }

    const chantier = await prisma.chantier.update({
      where: { id },
      data: validation.data,
    })

    return res.status(200).json({
      success: true,
      message: 'Chantier mis à jour avec succès',
      data: chantier,
    })
  } catch (error) {
    logger.error('Erreur updateChantier', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const deleteChantier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const existingChantier = await prisma.chantier.findUnique({
      where: { id },
    })

    if (!existingChantier) {
      return res.status(404).json({
        success: false,
        message: 'Chantier non trouvé',
      })
    }

    await prisma.chantier.delete({
      where: { id },
    })

    return res.status(200).json({
      success: true,
      message: 'Chantier supprimé avec succès',
    })
  } catch (error) {
    logger.error('Erreur deleteChantier', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const getChantierStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const stats = await prisma.feuilleTravail.aggregate({
      where: { chantierId: id },
      _sum: { heuresTotales: true },
      _count: true,
    })

    const fraisTotal = await prisma.frais.aggregate({
      where: {
        feuille: { chantierId: id },
      },
      _sum: { montant: true },
    })

    const monteursCount = await prisma.feuilleTravail.findMany({
      where: { chantierId: id },
      select: { monteurId: true },
      distinct: ['monteurId'],
    })

    return res.status(200).json({
      success: true,
      data: {
        heuresTotal: stats._sum.heuresTotales || 0,
        nombreFeuilles: stats._count,
        fraisTotal: fraisTotal._sum.montant || 0,
        nombreMonteurs: monteursCount.length,
      },
    })
  } catch (error) {
    logger.error('Erreur getChantierStats', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}
