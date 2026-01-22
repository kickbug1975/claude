"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Toutes les routes utilisateurs sont réservées aux ADMINS
router.use(auth_1.authenticate, (0, auth_1.authorize)('ADMIN'));
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lister tous les utilisateurs
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', userController_1.getAllUsers);
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par son ID
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id', userController_1.getUserById);
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Créer un nouvel utilisateur
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', userController_1.createUser);
/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Mettre à jour un utilisateur
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id', userController_1.updateUser);
/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/:id', userController_1.deleteUser);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map