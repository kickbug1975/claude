import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/database'
import { generateToken } from '../utils/jwt'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  role: z.enum(['ADMIN', 'SUPERVISEUR', 'MONTEUR']).optional(),
})

export const login = async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: validation.error.flatten().fieldErrors,
      })
    }

    const { email, password } = validation.data

    const user = await prisma.user.findUnique({
      where: { email },
      include: { monteur: true },
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      })
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          monteurId: user.monteurId,
          monteur: user.monteur,
        },
        token,
      },
    })
  } catch (error) {
    console.error('Erreur login:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const register = async (req: Request, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: validation.error.flatten().fieldErrors,
      })
    }

    const { email, password, role } = validation.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Cet email est déjà utilisé',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || 'MONTEUR',
      },
    })

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        token,
      },
    })
  } catch (error) {
    console.error('Erreur register:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

export const me = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { monteur: true },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        monteurId: user.monteurId,
        monteur: user.monteur,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    console.error('Erreur me:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}
