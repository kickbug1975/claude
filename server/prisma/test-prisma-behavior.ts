import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Test Prisma count with undefined companyId...')
    try {
        const count = await prisma.monteur.count({
            where: { companyId: undefined }
        })
        console.log('✅ Count works with undefined:', count)
    } catch (error) {
        console.error('❌ Count fails with undefined:', error)
    }

    try {
        const count = await prisma.monteur.count({
            where: { companyId: null as any }
        })
        console.log('✅ Count works with null:', count)
    } catch (error) {
        console.error('❌ Count fails with null:', error)
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect()
    })
