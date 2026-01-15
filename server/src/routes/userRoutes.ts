import { Router } from 'express'
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} from '../controllers/userController'
import { authenticate, authorize } from '../middlewares/auth'

const router = Router()

// Toutes les routes utilisateurs sont réservées aux ADMINS
router.use(authenticate, authorize('ADMIN'))

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lister tous les utilisateurs
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', getAllUsers)

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par son ID
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id', getUserById)

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Créer un nouvel utilisateur
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', createUser)

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Mettre à jour un utilisateur
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id', updateUser)

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/:id', deleteUser)

export default router
