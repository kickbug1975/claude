import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAssociations() {
    try {
        const admin = await prisma.user.findUnique({ where: { email: 'admin@maintenance.com' } })
        const activeCompany = await prisma.company.findFirst({ where: { active: true } })

        console.log(`Admin User Company ID: ${admin?.companyId}`)
        console.log(`Active Company ID: ${activeCompany?.id}`)

        const monteurs = await prisma.monteur.findMany()
        console.log(`Monteurs:`)
        monteurs.forEach(m => console.log(` - ${m.prenom} ${m.nom} (CompanyID: ${m.companyId})`))

        const chantiers = await prisma.chantier.findMany()
        console.log(`Chantiers:`)
        chantiers.forEach(c => console.log(` - ${c.nom} (CompanyID: ${c.companyId})`))

        // Check if any record has a NULL companyId
        const nullMonteurs = await prisma.monteur.count({ where: { companyId: null } })
        const nullChantiers = await prisma.chantier.count({ where: { companyId: null } })
        console.log(`Monteurs with NULL CompanyID: ${nullMonteurs}`)
        console.log(`Chantiers with NULL CompanyID: ${nullChantiers}`)

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkAssociations()
