// Script to check frais data in database
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkFrais() {
    try {
        console.log('Checking frais in database...\n');

        // Get all frais with their related feuille
        const frais = await prisma.frais.findMany({
            include: {
                feuille: {
                    select: { id: true, dateTravail: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        console.log(`Found ${frais.length} frais records:\n`);

        frais.forEach(f => {
            console.log(`ID: ${f.id}`);
            console.log(`  Type: "${f.type}" (${typeof f.type})`);
            console.log(`  Montant: ${f.montant}`);
            console.log(`  Description: "${f.description}"`);
            console.log(`  FeuilleId: ${f.feuilleId}`);
            console.log(`  CreatedAt: ${f.createdAt}`);
            console.log('---');
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkFrais();
