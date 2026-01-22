"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const env_1 = require("./env");
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Maintenance - Gestion Feuilles de Travail',
            version: '1.0.0',
            description: `
        API REST pour la gestion des feuilles de travail de maintenance.

        ## Fonctionnalités
        - 🔐 Authentification JWT
        - 👷 Gestion des monteurs
        - 🏗️ Gestion des chantiers
        - 📋 Gestion des feuilles de travail
        - 💰 Gestion des frais
        - 📎 Upload et gestion de fichiers
        - ⏰ Tâches planifiées (cron jobs)

        ## Sécurité
        - Protection CSRF sur toutes les routes mutantes
        - Rate limiting (100 req/15min global, 10 req/15min auth)
        - Authentification JWT avec Bearer token
        - Autorisation basée sur les rôles (ADMIN, SUPERVISEUR, MONTEUR)
      `,
            contact: {
                name: 'Support API',
                email: 'support@maintenance.com',
            },
            license: {
                name: 'ISC',
            },
        },
        servers: [
            {
                url: `http://localhost:${env_1.env.port}`,
                description: 'Serveur de développement',
            },
            {
                url: '{protocol}://{host}:{port}',
                description: 'Serveur personnalisé',
                variables: {
                    protocol: {
                        enum: ['http', 'https'],
                        default: 'http',
                    },
                    host: {
                        default: 'localhost',
                    },
                    port: {
                        default: env_1.env.port.toString(),
                    },
                },
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT obtenu via /api/auth/login',
                },
                csrfToken: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-csrf-token',
                    description: 'Token CSRF obtenu via /api/csrf-token',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        message: {
                            type: 'string',
                            example: 'Message d\'erreur',
                        },
                        error: {
                            type: 'string',
                            example: 'ERROR_CODE',
                        },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                        },
                        role: {
                            type: 'string',
                            enum: ['ADMIN', 'SUPERVISEUR', 'MONTEUR'],
                        },
                        monteurId: {
                            type: 'string',
                            format: 'uuid',
                            nullable: true,
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Monteur: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        nom: {
                            type: 'string',
                        },
                        prenom: {
                            type: 'string',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                        },
                        telephone: {
                            type: 'string',
                        },
                        adresse: {
                            type: 'string',
                        },
                        dateEmbauche: {
                            type: 'string',
                            format: 'date-time',
                        },
                        numeroIdentification: {
                            type: 'string',
                        },
                        actif: {
                            type: 'boolean',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Chantier: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        nom: {
                            type: 'string',
                        },
                        reference: {
                            type: 'string',
                        },
                        client: {
                            type: 'string',
                        },
                        adresse: {
                            type: 'string',
                        },
                        description: {
                            type: 'string',
                        },
                        dateDebut: {
                            type: 'string',
                            format: 'date-time',
                        },
                        dateFin: {
                            type: 'string',
                            format: 'date-time',
                            nullable: true,
                        },
                        actif: {
                            type: 'boolean',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                FeuilleTravail: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        monteurId: {
                            type: 'string',
                            format: 'uuid',
                        },
                        chantierId: {
                            type: 'string',
                            format: 'uuid',
                        },
                        dateTravail: {
                            type: 'string',
                            format: 'date-time',
                        },
                        heureDebut: {
                            type: 'string',
                            example: '08:00',
                        },
                        heureFin: {
                            type: 'string',
                            example: '17:00',
                        },
                        heuresTotales: {
                            type: 'number',
                            format: 'float',
                        },
                        descriptionTravail: {
                            type: 'string',
                        },
                        statut: {
                            type: 'string',
                            enum: ['BROUILLON', 'SOUMIS', 'VALIDE', 'REJETE'],
                        },
                        valideParId: {
                            type: 'string',
                            format: 'uuid',
                            nullable: true,
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Frais: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        feuilleId: {
                            type: 'string',
                            format: 'uuid',
                        },
                        typeFrais: {
                            type: 'string',
                            enum: ['TRANSPORT', 'MATERIEL', 'REPAS', 'AUTRES'],
                        },
                        montant: {
                            type: 'number',
                            format: 'float',
                        },
                        description: {
                            type: 'string',
                        },
                        fichierProuve: {
                            type: 'string',
                            nullable: true,
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Fichier: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        feuilleId: {
                            type: 'string',
                            format: 'uuid',
                            nullable: true,
                        },
                        nom: {
                            type: 'string',
                        },
                        cle: {
                            type: 'string',
                        },
                        url: {
                            type: 'string',
                            format: 'uri',
                        },
                        mimeType: {
                            type: 'string',
                        },
                        taille: {
                            type: 'integer',
                        },
                        description: {
                            type: 'string',
                            nullable: true,
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
            },
            responses: {
                UnauthorizedError: {
                    description: 'Token JWT manquant ou invalide',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                            example: {
                                success: false,
                                message: 'Non autorisé',
                                error: 'UNAUTHORIZED',
                            },
                        },
                    },
                },
                ForbiddenError: {
                    description: 'Accès interdit (permissions insuffisantes ou CSRF invalide)',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                            example: {
                                success: false,
                                message: 'Accès interdit',
                                error: 'FORBIDDEN',
                            },
                        },
                    },
                },
                NotFoundError: {
                    description: 'Ressource non trouvée',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                            example: {
                                success: false,
                                message: 'Ressource non trouvée',
                                error: 'NOT_FOUND',
                            },
                        },
                    },
                },
                ValidationError: {
                    description: 'Erreur de validation des données',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                            example: {
                                success: false,
                                message: 'Données invalides',
                                error: 'VALIDATION_ERROR',
                            },
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            {
                name: 'Auth',
                description: 'Authentification et gestion des utilisateurs',
            },
            {
                name: 'Monteurs',
                description: 'Gestion des monteurs',
            },
            {
                name: 'Chantiers',
                description: 'Gestion des chantiers',
            },
            {
                name: 'Feuilles',
                description: 'Gestion des feuilles de travail',
            },
            {
                name: 'Fichiers',
                description: 'Upload et gestion de fichiers',
            },
            {
                name: 'Cron',
                description: 'Gestion des tâches planifiées',
            },
            {
                name: 'CSRF',
                description: 'Protection CSRF',
            },
        ],
    },
    apis: [
        './src/routes/*.ts', // Chercher les annotations dans tous les fichiers de routes
        './src/controllers/*.ts', // Et dans les contrôleurs
    ],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swagger.js.map