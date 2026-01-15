import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/database'
import { generateToken } from '../utils/jwt'
import {
  generateRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
} from '../utils/refreshToken'
import { z } from 'zod'
import { logger } from '../utils/logger'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  role: z.enum(['ADMIN', 'SUPERVISEUR', 'MONTEUR']).optional(),
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
})

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Ancien mot de passe requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
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

    // Générer le token JWT (courte durée)
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Générer le refresh token (longue durée)
    const refreshToken = await generateRefreshToken(user.id)

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
        refreshToken,
      },
    })
  } catch (error) {
    logger.error('Erreur login', error instanceof Error ? error : undefined, {
      email: req.body.email,
    })
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

    if (!user) {
      throw new Error('Erreur lors de la création de l\'utilisateur')
    }

    // Générer le token JWT (courte durée)
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Générer le refresh token (longue durée)
    const refreshToken = await generateRefreshToken(user.id)

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
        refreshToken,
      },
    })
  } catch (error) {
    logger.error('Erreur register', error instanceof Error ? error : undefined, {
      email: req.body.email,
    })
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
    logger.error('Erreur me', error instanceof Error ? error : undefined, {
      userId: req.user?.userId,
    })
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

/**
 * Rafraîchit le token JWT en utilisant un refresh token valide
 */
export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requis',
      })
    }

    // Valider le refresh token
    const user = await validateRefreshToken(refreshToken)

    // Générer un nouveau token JWT
    const newToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Générer un nouveau refresh token
    const newRefreshToken = await generateRefreshToken(user.id)

    // Révoquer l'ancien refresh token
    await revokeRefreshToken(refreshToken)

    return res.status(200).json({
      success: true,
      message: 'Token rafraîchi avec succès',
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    })
  } catch (error: any) {
    logger.error('Erreur refresh', error instanceof Error ? error : undefined)
    return res.status(401).json({
      success: false,
      message: error.message || 'Token de rafraîchissement invalide',
    })
  }
}

/**
 * Déconnecte l'utilisateur en révoquant son refresh token
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body

    if (refreshToken) {
      await revokeRefreshToken(refreshToken)
    }

    return res.status(200).json({
      success: true,
      message: 'Déconnexion réussie',
    })
  } catch (error) {
    logger.error('Erreur logout', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

/**
 * Révoque tous les refresh tokens de l'utilisateur (déconnexion de tous les appareils)
 */
export const logoutAll = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      })
    }

    await revokeAllUserRefreshTokens(req.user.userId)

    return res.status(200).json({
      success: true,
      message: 'Déconnexion de tous les appareils réussie',
    })
  } catch (error) {
    logger.error('Erreur logoutAll', error instanceof Error ? error : undefined, {
      userId: req.user?.userId,
    })
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

/**
 * Demande de réinitialisation de mot de passe
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const validation = forgotPasswordSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: validation.error.flatten().fieldErrors,
      })
    }

    const { email } = validation.data

    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Pour des raisons de sécurité, on ne dit pas si l'email existe ou non
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Si un compte est associé à cet email, un lien de réinitialisation a été envoyé',
      })
    }

    // Supprimer les anciens tokens de réinitialisation pour cet utilisateur
    await prisma.resetToken.deleteMany({
      where: { userId: user.id },
    })

    // Générer un nouveau token de réinitialisation (valable 1 heure)
    const crypto = await import('crypto')
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    await prisma.resetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    // Envoyer l'email
    const { emailService } = await import('../services/emailService')
    await emailService.sendPasswordReset(user.email, token)

    return res.status(200).json({
      success: true,
      message: 'Si un compte est associé à cet email, un lien de réinitialisation a été envoyé',
    })
  } catch (error) {
    logger.error('Erreur forgotPassword', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

/**
 * Réinitialisation du mot de passe avec le token
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: validation.error.flatten().fieldErrors,
      })
    }

    const { token, password } = validation.data

    const resetToken = await prisma.resetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken || resetToken.expiresAt < new Date()) {
      if (resetToken) {
        await prisma.resetToken.delete({ where: { id: resetToken.id } })
      }
      return res.status(400).json({
        success: false,
        message: 'Le lien de réinitialisation est invalide ou a expiré',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Mettre à jour le mot de passe et révoquer tous les tokens de l'utilisateur
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.resetToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
      prisma.refreshToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ])

    return res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
    })
  } catch (error) {
    logger.error('Erreur resetPassword', error instanceof Error ? error : undefined)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

/**
 * Changement de mot de passe (utilisateur connecté)
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      })
    }

    const validation = changePasswordSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: validation.error.flatten().fieldErrors,
      })
    }

    const { oldPassword, newPassword } = validation.data

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password)

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Ancien mot de passe incorrect',
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return res.status(200).json({
      success: true,
      message: 'Mot de passe modifié avec succès',
    })
  } catch (error) {
    logger.error('Erreur changePassword', error instanceof Error ? error : undefined, {
      userId: req.user?.userId,
    })
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}
