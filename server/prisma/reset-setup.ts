import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetSetup() {
    try {
        const company = await prisma.company.findFirst({
            where: { active: true }
        })

        if (company) {
            await prisma.company.update({
                where: { id: company.id },
                data: { isSetupComplete: false }
            })
            console.log(`✅ Setup reset for company: ${company.name}`)
        } else {
            console.log('❌ No active company found to reset.')
        }
    } catch (error) {
        console.error('Error resetting setup:', error)
    } finally {
        await prisma.$disconnect()
    }
}

resetSetup()
