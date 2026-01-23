import { Router } from 'express';
import { prisma } from '../config/prisma';
import { authenticate } from '../middlewares/auth';

const router = Router();

// GET /api/users - Liste tous les utilisateurs
router.get('/', authenticate, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                name: true,
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
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                email: true,
                role: true,
                name: true,
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
        const { password, ...userData } = req.body;
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                ...userData,
                password: hashedPassword,
            },
            select: {
                id: true,
                email: true,
                role: true,
                name: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.status(201).json({ success: true, data: user });
    } catch (error: any) {
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

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
            select: {
                id: true,
                email: true,
                role: true,
                name: true,
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
        await prisma.user.delete({
            where: { id: parseInt(id) },
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
