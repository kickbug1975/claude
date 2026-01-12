import { Router } from 'express'
import { login, register, me } from '../controllers/authController'
import { authenticate } from '../middlewares/auth'

const router = Router()

// POST /api/auth/login - Connexion
router.post('/login', login)

// POST /api/auth/register - Inscription
router.post('/register', register)

// GET /api/auth/me - Profil utilisateur connecté
router.get('/me', authenticate, me)

export default router
