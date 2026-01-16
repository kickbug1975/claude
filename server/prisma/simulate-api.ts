import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function simulateRequest() {
    try {
        const monteurs = await prisma.monteur.findMany({
            orderBy: { nom: 'asc' },
            include: {
                user: {
                    select: { id: true, email: true, role: true },
                },
            },
        })

        console.log(`Server would return ${monteurs.length} monteurs.`)
        console.log(JSON.stringify(monteurs, null, 2))
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

simulateRequest()
