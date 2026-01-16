import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth'
import { upload } from '../config/multer'
import {
    getSetupStatus,
    updateCompanyInfo,
    uploadLogos,
    importData,
    finalizeSetup,
    createInitialAdmin,
} from '../controllers/setupController'

const router = Router()

// La lecture du statut est possible sans authentification (pour détecter le besoin de configuration au démarrage)
router.get('/status', getSetupStatus)

// Création du premier administrateur (public si aucun admin n'existe)
router.post('/admin', createInitialAdmin)

// Les autres étapes sont réservées aux ADMINS
router.use(authenticate, authorize('ADMIN'))

router.put('/company', updateCompanyInfo)

router.post(
    '/logos',
    upload.fields([
        { name: 'companyLogo', maxCount: 1 },
        { name: 'loginLogo', maxCount: 1 },
    ]),
    uploadLogos
)

router.post('/import', importData)

router.post('/finalize', finalizeSetup)

export default router
