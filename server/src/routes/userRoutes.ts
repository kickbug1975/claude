import { Router } from 'express';
import { prisma } from '../config/prisma';
import { authenticate } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();

// Validation schema for creating/updating users
const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).optional(), // Optional for updates
    role: z.enum(['ADMIN', 'SUPERVISEUR', 'MONTEUR']),
    nom: z.string().optional(),
    prenom: z.string().optional(),
    monteurId: z.string().optional(),
    isActive: z.boolean().optional(),
});

// Additional fields required when creating a MONTEUR user
const monteurFieldsSchema = z.object({
    telephone: z.string().min(1, 'Téléphone requis'),
    adresse: z.string().min(1, 'Adresse requise'),
    numeroIdentification: z.string().min(1, 'Numéro d\'identification requis'),
    dateEmbauche: z.string().optional(),
});

// GET /api/users - Liste tous les utilisateurs de maintenance
router.get('/', authenticate, async (req, res) => {
    try {
        const users = await prisma.maintenanceUser.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                nom: true,
                prenom: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                monteurId: true,
                monteur: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: users });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/users/:id - Récupère un utilisateur par ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.maintenanceUser.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                nom: true,
                prenom: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                monteurId: true,
                monteur: true,
            },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/users - Crée un nouvel utilisateur
router.post('/', authenticate, async (req, res) => {
    try {
        const validation = userSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: validation.error.flatten().fieldErrors
            });
        }

        const { password, role, email, nom, prenom, telephone, adresse, numeroIdentification, dateEmbauche, ...rest } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, message: 'Mot de passe requis pour la création' });
        }

        // If role is MONTEUR, validate additional fields
        if (role === 'MONTEUR') {
            const monteurValidation = monteurFieldsSchema.safeParse({ telephone, adresse, numeroIdentification, dateEmbauche });
            if (!monteurValidation.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Champs monteur invalides',
                    errors: monteurValidation.error.flatten().fieldErrors
                });
            }

            if (!nom || !prenom) {
                return res.status(400).json({ success: false, message: 'Nom et prénom requis pour un monteur' });
            }
        }

        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        // If role is MONTEUR, create Monteur profile first, then link it
        let monteurId: string | undefined = undefined;

        if (role === 'MONTEUR') {
            const monteur = await prisma.monteur.create({
                data: {
                    nom: nom!,
                    prenom: prenom!,
                    email,
                    telephone,
                    adresse,
                    numeroIdentification,
                    dateEmbauche: dateEmbauche ? new Date(dateEmbauche) : new Date(),
                    actif: true,
                },
            });
            monteurId = monteur.id;
        }

        const user = await prisma.maintenanceUser.create({
            data: {
                email,
                password: hashedPassword,
                role,
                nom,
                prenom,
                monteurId,
                isActive: true,
                ...rest,
            },
            select: {
                id: true,
                email: true,
                role: true,
                nom: true,
                prenom: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                monteurId: true,
                monteur: true,
            },
        });

        res.status(201).json({ success: true, data: user });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// PATCH /api/users/:id - Met à jour un utilisateur
router.patch('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { password, ...userData } = req.body;

        const updateData: any = userData;
        if (password) {
            const bcrypt = await import('bcryptjs');
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.maintenanceUser.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                role: true,
                nom: true,
                prenom: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.json({ success: true, data: user });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/users/:id - Supprime un utilisateur
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.maintenanceUser.delete({
            where: { id },
        });

        res.json({ success: true, message: 'Utilisateur supprimé' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
