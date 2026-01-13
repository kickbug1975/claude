import { Router } from 'express'
import { login, register, me, refresh, logout, logoutAll } from '../controllers/authController'
import { authenticate } from '../middlewares/auth'

const router = Router()

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     description: Authentifie un utilisateur et retourne un token JWT
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@maintenance.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Admin123!
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         description: Trop de tentatives de connexion
 */
router.post('/login', login)

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscription utilisateur
 *     description: Crée un nouveau compte utilisateur (Admin uniquement en production)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nouveau@maintenance.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: Password123!
 *               role:
 *                 type: string
 *                 enum: [ADMIN, SUPERVISEUR, MONTEUR]
 *                 example: MONTEUR
 *               monteurId:
 *                 type: string
 *                 format: uuid
 *                 description: ID du monteur à lier (optionnel)
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/register', register)

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Profil utilisateur connecté
 *     description: Retourne les informations du profil de l'utilisateur authentifié
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', authenticate, me)

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Rafraîchir le token JWT
 *     description: Génère un nouveau token JWT en utilisant un refresh token valide
 *     tags: [Auth]
 *     security:
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token valide obtenu lors de la connexion
 *     responses:
 *       200:
 *         description: Token rafraîchi avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: Nouveau token JWT
 *                     refreshToken:
 *                       type: string
 *                       description: Nouveau refresh token
 *       401:
 *         description: Refresh token invalide ou expiré
 */
router.post('/refresh', refresh)

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Déconnexion
 *     description: Révoque le refresh token de l'utilisateur
 *     tags: [Auth]
 *     security:
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token à révoquer
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 */
router.post('/logout', logout)

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Déconnexion de tous les appareils
 *     description: Révoque tous les refresh tokens de l'utilisateur (déconnexion globale)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     responses:
 *       200:
 *         description: Déconnexion de tous les appareils réussie
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/logout-all', authenticate, logoutAll)

export default router
