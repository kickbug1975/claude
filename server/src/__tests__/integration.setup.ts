import { prisma, connectDatabase } from '../config/database'
import { logger } from '../utils/logger'

// Configuration de l'environnement de test
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key-for-testing-integration'
process.env.JWT_EXPIRES_IN = '1h'

// Utiliser la base de données de développement pour les tests
// Note: Dans un environnement de production, vous devriez créer une base de données de test séparée
// Pour l'instant, on utilise la même DB que le développement
if (!process.env.DATABASE_URL) {
    // Par défaut, utiliser la même DB que le développement
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/maintenance_db'
}

/**
 * Nettoie toutes les tables de la base de données
 */
export const cleanDatabase = async () => {
    // Supprimer dans l'ordre des dépendances pour éviter les deadlocks
    await prisma.fichier.deleteMany({})
    await prisma.frais.deleteMany({})
    await prisma.feuilleTravail.deleteMany({})
    await prisma.refreshToken.deleteMany({})
    await prisma.monteur.deleteMany({})
    await prisma.chantier.deleteMany({})
    await prisma.user.deleteMany({})
}

// Nettoyer UNE SEULE FOIS au tout début
let isCleanedOnce = false

beforeAll(async () => {
    try {
        // Connexion à la base de données
        await connectDatabase()

        // Nettoyer la base de données UNE SEULE FOIS
        if (!isCleanedOnce) {
            await cleanDatabase()
            isCleanedOnce = true
        }

        logger.info('Connecté à la base de données de test pour l\'intégration')
    } catch (error) {
        logger.error('Erreur lors du setup de la base de données de test', error)
        throw error
    }
})

afterAll(async () => {
    // Nettoyer après tous les tests
    await cleanDatabase()
    // Fermer la connexion
    await prisma.$disconnect()
})

// Nettoyer après chaque test
// NOTE: Désactivé pour éviter de supprimer les données entre les tests
// Les tests doivent gérer leur propre nettoyage si nécessaire
// afterEach(async () => {
//     await cleanDatabase()
// })
