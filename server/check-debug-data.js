
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    console.log('--- Monteur Check ---');
    const monteur = await prisma.monteur.findFirst({
        where: {
            OR: [
                { numeroIdentification: 'MTR-001' },
                { nom: { contains: 'Puche', mode: 'insensitive' } }
            ]
        },
        include: {
            feuilles: true
        }
    });

    if (!monteur) {
        console.log('❌ Monteur not found for MTR-001 or name "Puche"');
    } else {
        console.log(`✅ Found Monteur: ${monteur.prenom} ${monteur.nom} (ID: ${monteur.id})`);
        console.log(`   Identification: ${monteur.numeroIdentification}`);
        console.log(`   Actif: ${monteur.actif}`);
        console.log(`   Feuilles count: ${monteur.feuilles.length}`);

        if (monteur.feuilles.length > 0) {
            monteur.feuilles.forEach(f => {
                console.log(`   - Feuille ${f.id}: ${f.dateTravail.toISOString()} - Statut: ${f.statut}`);
            });
        }
    }

    console.log('\n--- Recent Feuilles Check ---');
    const recentFeuilles = await prisma.feuilleTravail.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { monteur: true }
    });

    recentFeuilles.forEach(f => {
        console.log(`Feuille ${f.id} created at ${f.createdAt.toISOString()}`);
        console.log(`   Monteur: ${f.monteur?.prenom} ${f.monteur?.nom} (${f.monteurId})`);
        console.log(`   Statut: ${f.statut}`);
    });
}

checkData()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
