import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { z } from 'zod'
import { logger } from '../utils/logger'
import { storageService } from '../services/s3Service'
import bcrypt from 'bcryptjs'
import { generateToken } from '../utils/jwt'
import { generateRefreshToken } from '../utils/refreshToken'

const companySchema = z.object({
    name: z.string().min(1, 'Nom requis'),
    siret: z.string().optional(),
    address: z.string().optional(),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
    phone: z.string().optional(),
})

const importSchema = z.object({
    monteurs: z.array(z.object({
        nom: z.string(),
        prenom: z.string(),
        telephone: z.string(),
        email: z.string().email(),
        adresse: z.string(),
        dateEmbauche: z.string(),
        numeroIdentification: z.string(),
    })).optional(),
    chantiers: z.array(z.object({
        nom: z.string(),
        adresse: z.string(),
        client: z.string(),
        reference: z.string(),
        dateDebut: z.string(),
        dateFin: z.string().optional(),
        description: z.string(),
    })).optional(),
})

export const getSetupStatus = async (_req: Request, res: Response) => {
    try {
        const company = await prisma.company.findFirst({
            where: { active: true },
        })

        const [monteurCount, chantierCount, adminUser] = await Promise.all([
            prisma.monteur.count(),
            prisma.chantier.count(),
            prisma.user.findFirst({ where: { role: 'ADMIN' } })
        ])

        return res.status(200).json({
            success: true,
            data: {
                isSetupComplete: company?.isSetupComplete || false,
                hasAdmin: !!adminUser,
                company: company || null,
                counts: {
                    monteurs: monteurCount,
                    chantiers: chantierCount,
                }
            },
        })
    } catch (error) {
        logger.error('Erreur getSetupStatus detail:', error instanceof Error ? error : error)
        return res.status(500).json({ success: false, message: 'Erreur serveur lors du chargement de la configuration' })
    }
}

export const createInitialAdmin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email et mot de passe requis' })
        }

        // Vérifier si un admin existe déjà
        const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
        if (existingAdmin) {
            return res.status(403).json({ success: false, message: 'Un administrateur existe déjà' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'ADMIN',
            }
        })

        logger.info(`Nouvel administrateur créé : ${email}`)

        // On connecte directement l'utilisateur
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        })
        const refreshToken = await generateRefreshToken(user.id)

        return res.status(201).json({
            success: true,
            message: 'Compte administrateur créé avec succès',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
                token,
                refreshToken
            }
        })
    } catch (error) {
        logger.error('Erreur createInitialAdmin detail:', error instanceof Error ? error : error)
        return res.status(500).json({ success: false, message: 'Erreur serveur' })
    }
}

export const updateCompanyInfo = async (req: Request, res: Response) => {
    try {
        const validation = companySchema.safeParse(req.body)
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: validation.error.flatten().fieldErrors,
            })
        }

        let company = await prisma.company.findFirst({ where: { active: true } })

        if (company) {
            company = await prisma.company.update({
                where: { id: company.id },
                data: validation.data,
            })
        } else {
            company = await prisma.company.create({
                data: {
                    ...validation.data,
                    isSetupComplete: false,
                },
            })
        }

        // Note: In single-tenant mode, no need to link user to company

        return res.status(200).json({
            success: true,
            message: 'Informations entreprise mises à jour',
            data: company,
        })
    } catch (error) {
        logger.error('Erreur updateCompanyInfo detail:', error instanceof Error ? error : error)
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la mise à jour de l\'entreprise' })
    }
}

export const uploadLogos = async (req: Request, res: Response) => {
    try {
        if (!req.files) {
            return res.status(400).json({ success: false, message: 'Aucun fichier reçu' })
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] }
        const company = await prisma.company.findFirst({ where: { active: true } })

        if (!company) {
            return res.status(404).json({ success: false, message: 'Entreprise non trouvée' })
        }

        const updates: any = {}

        if (files.companyLogo && files.companyLogo.length > 0) {
            const file = files.companyLogo[0]
            try {
                const uploaded = await storageService.upload(
                    {
                        buffer: file.buffer,
                        originalname: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size,
                    },
                    'branding'
                )
                updates.companyLogoUrl = uploaded.url
            } catch (err) {
                logger.error('Erreur upload companyLogo', err)
            }
        }

        if (files.loginLogo && files.loginLogo.length > 0) {
            const file = files.loginLogo[0]
            try {
                const uploaded = await storageService.upload(
                    {
                        buffer: file.buffer,
                        originalname: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size,
                    },
                    'branding'
                )
                updates.loginLogoUrl = uploaded.url
            } catch (err) {
                logger.error('Erreur upload loginLogo', err)
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'Aucun logo valide configuré' })
        }

        const updatedCompany = await prisma.company.update({
            where: { id: company.id },
            data: updates,
        })

        return res.status(200).json({
            success: true,
            data: updatedCompany,
        })
    } catch (error) {
        logger.error('Erreur uploadLogos critique', error instanceof Error ? error : undefined)
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de l\'upload des logos' })
    }
}

export const importData = async (req: Request, res: Response) => {
    try {
        const validation = importSchema.safeParse(req.body)
        if (!validation.success) {
            return res.status(400).json({ success: false, message: 'Données d\'import invalides' })
        }

        const company = await prisma.company.findFirst({ where: { active: true } })
        if (!company) {
            return res.status(400).json({ success: false, message: 'Configurez d\'abord l\'entreprise' })
        }

        const { monteurs, chantiers } = validation.data

        let importedMonteurs = 0
        let importedChantiers = 0

        if (monteurs && monteurs.length > 0) {
            const result = await prisma.monteur.createMany({
                data: monteurs.map(m => ({
                    ...m,
                    dateEmbauche: new Date(m.dateEmbauche),
                })),
                skipDuplicates: true,
            })
            importedMonteurs = result.count
        }

        if (chantiers && chantiers.length > 0) {
            const result = await prisma.chantier.createMany({
                data: chantiers.map(c => ({
                    ...c,
                    dateDebut: new Date(c.dateDebut),
                    dateFin: c.dateFin ? new Date(c.dateFin) : null,
                })),
                skipDuplicates: true,
            })
            importedChantiers = result.count
        }

        return res.status(200).json({
            success: true,
            message: 'Données traitées avec succès',
            data: {
                importedMonteurs,
                importedChantiers
            }
        })
    } catch (error) {
        logger.error('Erreur importData detail:', error instanceof Error ? error : error)
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de l\'importation des données' })
    }
}

export const finalizeSetup = async (_req: Request, res: Response) => {
    try {
        const company = await prisma.company.findFirst({ where: { active: true } })
        if (!company) {
            return res.status(404).json({ success: false, message: 'Entreprise non trouvée' })
        }

        await prisma.company.update({
            where: { id: company.id },
            data: { isSetupComplete: true },
        })

        return res.status(200).json({
            success: true,
            message: 'Configuration terminée',
        })
    } catch (error) {
        logger.error('Erreur finalizeSetup detail:', error instanceof Error ? error : error)
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la finalisation' })
    }
}
