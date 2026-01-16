import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkData() {
    try {
        const companyCount = await prisma.company.count()
        const activeCompany = await prisma.company.findFirst({ where: { active: true } })
        const userCount = await prisma.user.count()
        const monteurCount = await prisma.monteur.count()
        const chantierCount = await prisma.chantier.count()

        console.log(`--- DB Check ---`)
        console.log(`Total Companies: ${companyCount}`)
        console.log(`Active Company ID: ${activeCompany?.id || 'None'}`)
        console.log(`Total Users: ${userCount}`)
        console.log(`Total Monteurs: ${monteurCount}`)
        console.log(`Total Chantiers: ${chantierCount}`)

        if (activeCompany) {
            const monteursInCompany = await prisma.monteur.count({ where: { companyId: activeCompany.id } })
            const chantiersInCompany = await prisma.chantier.count({ where: { companyId: activeCompany.id } })
            console.log(`Monteurs in Active Company: ${monteursInCompany}`)
            console.log(`Chantiers in Active Company: ${chantiersInCompany}`)
        }
    } catch (error) {
        console.error('Error checking data:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkData()
