const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listFeuilles() {
    console.log('Listing all Feuilles de Travail...');
    const feuilles = await prisma.feuilleTravail.findMany({
        include: {
            monteur: true,
            chantier: true
        }
    });

    if (feuilles.length === 0) {
        console.log('❌ No worksheets found in database.');
    } else {
        console.log(`✅ Found ${feuilles.length} worksheet(s):`);
        feuilles.forEach(f => {
            console.log(`- ID: ${f.id}`);
            console.log(`  Statut: ${f.statut}`);
            console.log(`  Monteur: ${f.monteur?.nom} ${f.monteur?.prenom} (ID: ${f.monteurId})`);
            console.log(`  Created By User (Admin?): Unknown (no creator field)`);
            console.log(`  Date: ${f.dateTravail}`);
        });
    }
}

listFeuilles().finally(() => prisma.$disconnect());
