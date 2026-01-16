import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const company = await prisma.company.findFirst({ where: { active: true } })
    console.log('Company:', company)
    if (company) {
        console.log('Company Logo URL:', company.companyLogoUrl)
        console.log('Login Logo URL:', company.loginLogoUrl)
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect())
