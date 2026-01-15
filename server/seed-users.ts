import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await bcrypt.hash('Password123!', 10)

    // Création Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@test.com' },
        update: {},
        create: {
            email: 'admin@test.com',
            password: password,
            role: 'ADMIN',
        },
    })
    console.log('Admin created:', admin.email)

    // Création Monteur
    const monteurUser = await prisma.user.upsert({
        where: { email: 'user@test.com' },
        update: {},
        create: {
            email: 'user@test.com',
            password: password,
            role: 'MONTEUR',
        },
    })
    console.log('Monteur user created:', monteurUser.email)

    // Créer l'entité Monteur liée
    if (monteurUser) {
        const monteur = await prisma.monteur.upsert({
            where: { email: 'user@test.com' },
            update: {},
            create: {
                nom: 'Dupont',
                prenom: 'Jean',
                email: 'user@test.com',
                telephone: '0123456789',
                adresse: '123 Rue de la Paix',
                dateEmbauche: new Date(),
                numeroIdentification: 'M001',
                actif: true
            }
        })
        await prisma.user.update({
            where: { id: monteurUser.id },
            data: { monteurId: monteur.id }
        })
        console.log('Monteur entity linked:', monteur.email)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
