import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSetup() {
    try {
        const company = await prisma.company.findFirst()
        console.log(JSON.stringify(company, null, 2))
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkSetup()
