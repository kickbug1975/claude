"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const multer_1 = require("../config/multer");
const setupController_1 = require("../controllers/setupController");
const router = (0, express_1.Router)();
// La lecture du statut est possible sans authentification (pour détecter le besoin de configuration au démarrage)
router.get('/status', setupController_1.getSetupStatus);
// Création du premier administrateur (public si aucun admin n'existe)
router.post('/admin', setupController_1.createInitialAdmin);
// Les autres étapes sont réservées aux ADMINS
router.use(auth_1.authenticate, (0, auth_1.authorize)('ADMIN'));
router.put('/company', setupController_1.updateCompanyInfo);
router.post('/logos', multer_1.upload.fields([
    { name: 'companyLogo', maxCount: 1 },
    { name: 'loginLogo', maxCount: 1 },
]), setupController_1.uploadLogos);
router.post('/import', setupController_1.importData);
router.post('/finalize', setupController_1.finalizeSetup);
exports.default = router;
//# sourceMappingURL=setupRoutes.js.map