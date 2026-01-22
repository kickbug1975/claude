"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.connectDatabase = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
exports.prisma = global.prisma ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
    });
if (process.env.NODE_ENV !== 'production') {
    global.prisma = exports.prisma;
}
// Tester la connexion
const connectDatabase = async () => {
    try {
        await exports.prisma.$connect();
        logger_1.logger.success('✅ Connexion à PostgreSQL établie avec succès');
    }
    catch (error) {
        logger_1.logger.error('❌ Erreur de connexion à PostgreSQL:', error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
// Déconnexion propre
const disconnectDatabase = async () => {
    await exports.prisma.$disconnect();
    logger_1.logger.info('Déconnexion de PostgreSQL');
};
exports.disconnectDatabase = disconnectDatabase;
// Gestion de la fermeture propre de l'application
process.on('beforeExit', async () => {
    await (0, exports.disconnectDatabase)();
});
//# sourceMappingURL=database.js.map