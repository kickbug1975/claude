"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanDatabase = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
// Configuration de l'environnement de test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-integration';
process.env.JWT_EXPIRES_IN = '1h';
// Utiliser la base de données de développement pour les tests
// Note: Dans un environnement de production, vous devriez créer une base de données de test séparée
// Pour l'instant, on utilise la même DB que le développement
if (!process.env.DATABASE_URL) {
    // Par défaut, utiliser la même DB que le développement
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/maintenance_db';
}
/**
 * Nettoie toutes les tables de la base de données
 */
const cleanDatabase = async () => {
    // Supprimer dans l'ordre des dépendances pour éviter les deadlocks
    await database_1.prisma.fichier.deleteMany({});
    await database_1.prisma.frais.deleteMany({});
    await database_1.prisma.feuilleTravail.deleteMany({});
    await database_1.prisma.refreshToken.deleteMany({});
    await database_1.prisma.monteur.deleteMany({});
    await database_1.prisma.chantier.deleteMany({});
    await database_1.prisma.user.deleteMany({});
};
exports.cleanDatabase = cleanDatabase;
// Nettoyer UNE SEULE FOIS au tout début
let isCleanedOnce = false;
beforeAll(async () => {
    try {
        // Connexion à la base de données
        await (0, database_1.connectDatabase)();
        // Nettoyer la base de données UNE SEULE FOIS
        if (!isCleanedOnce) {
            await (0, exports.cleanDatabase)();
            isCleanedOnce = true;
        }
        logger_1.logger.info('Connecté à la base de données de test pour l\'intégration');
    }
    catch (error) {
        logger_1.logger.error('Erreur lors du setup de la base de données de test', error);
        throw error;
    }
});
afterAll(async () => {
    // Nettoyer après tous les tests
    await (0, exports.cleanDatabase)();
    // Fermer la connexion
    await database_1.prisma.$disconnect();
});
// Nettoyer après chaque test
// NOTE: Désactivé pour éviter de supprimer les données entre les tests
// Les tests doivent gérer leur propre nettoyage si nécessaire
// afterEach(async () => {
//     await cleanDatabase()
// })
//# sourceMappingURL=integration.setup.js.map