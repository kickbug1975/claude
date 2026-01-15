import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { z } from 'zod'
import { logger } from '../utils/logger'
import bcrypt from 'bcryptjs'

const createUserSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    role: z.enum(['ADMIN', 'SUPERVISEUR', 'MONTEUR']),
    monteurId: z.string().uuid().optional().nullable(),
})

const updateUserSchema = z.object({
    email: z.string().email('Email invalide').optional(),
    role: z.enum(['ADMIN', 'SUPERVISEUR', 'MONTEUR']).optional(),
    monteurId: z.string().uuid().optional().nullable(),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').optional(),
})

/**
 * Liste tous les utilisateurs
 */
export const getAllUsers = async (_req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                monteur: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        const safeUsers = users.map((user) => {
            const { password, ...userWithoutPassword } = user
            return userWithoutPassword
        })

        return res.status(200).json({
            success: true,
            data: safeUsers,
        })
    } catch (error) {
        logger.error('Erreur getAllUsers', error instanceof Error ? error : undefined)
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        })
    }
}

/**
 * Récupère un utilisateur par son ID
 */
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                monteur: true,
            },
        })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé',
            })
        }

        const { password, ...userWithoutPassword } = user

        return res.status(200).json({
            success: true,
            data: userWithoutPassword,
        })
    } catch (error) {
        logger.error('Erreur getUserById', error instanceof Error ? error : undefined)
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        })
    }
}

/**
 * Crée un nouvel utilisateur
 */
export const createUser = async (req: Request, res: Response) => {
    try {
        const validation = createUserSchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: validation.error.flatten().fieldErrors,
            })
        }

        const { email, password, role, monteurId } = validation.data

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
                role,
                monteurId,
            },
        })

        const { password: _, ...userWithoutPassword } = user

        return res.status(201).json({
            success: true,
            message: 'Utilisateur créé avec succès',
            data: userWithoutPassword,
        })
    } catch (error) {
        logger.error('Erreur createUser', error instanceof Error ? error : undefined)
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        })
    }
}

/**
 * Met à jour un utilisateur
 */
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const validation = updateUserSchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: validation.error.flatten().fieldErrors,
            })
        }

        const updateData: any = { ...validation.data }

        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10)
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
        })

        const { password, ...userWithoutPassword } = user

        return res.status(200).json({
            success: true,
            message: 'Utilisateur mis à jour avec succès',
            data: userWithoutPassword,
        })
    } catch (error) {
        logger.error('Erreur updateUser', error instanceof Error ? error : undefined)
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        })
    }
}

/**
 * Supprime un utilisateur
 */
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        // Empêcher la suppression de son propre compte (optionnel)
        if (id === req.user?.userId) {
            return res.status(400).json({
                success: false,
                message: 'Vous ne pouvez pas supprimer votre propre compte',
            })
        }

        await prisma.user.delete({
            where: { id },
        })

        return res.status(200).json({
            success: true,
            message: 'Utilisateur supprimé avec succès',
        })
    } catch (error) {
        logger.error('Erreur deleteUser', error instanceof Error ? error : undefined)
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        })
    }
}
