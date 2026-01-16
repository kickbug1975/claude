import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🗑️ Suppression des administrateurs...')
    // On supprime d'abord les refresh tokens pour éviter les erreurs de contrainte
    await prisma.refreshToken.deleteMany({})

    const result = await prisma.user.deleteMany({
        where: { role: 'ADMIN' }
    })
    console.log(`✅ ${result.count} administrateur(s) supprimé(s).`)

    await prisma.company.updateMany({
        data: { isSetupComplete: false }
    })
    console.log('✅ État isSetupComplete remis à false.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
