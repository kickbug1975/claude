import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

// Singleton Prisma Client
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

// Tester la connexion
export const connectDatabase = async () => {
  try {
    await prisma.$connect()
    logger.success('✅ Connexion à PostgreSQL établie avec succès')
  } catch (error) {
    logger.error('❌ Erreur de connexion à PostgreSQL:', error)
    process.exit(1)
  }
}

// Déconnexion propre
export const disconnectDatabase = async () => {
  await prisma.$disconnect()
  logger.info('Déconnexion de PostgreSQL')
}

// Gestion de la fermeture propre de l'application
process.on('beforeExit', async () => {
  await disconnectDatabase()
})
