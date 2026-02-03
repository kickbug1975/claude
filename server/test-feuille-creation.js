// Test feuille creation to identify the error
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFeuilleCreation() {
    try {
        console.log('🧪 Testing feuille creation...\n');

        // First, check if we have monteurs and chantiers
        const monteurs = await prisma.monteur.findMany({ take: 1 });
        const chantiers = await prisma.chantier.findMany({ take: 1 });

        if (monteurs.length === 0) {
            console.log('❌ No monteurs found in database');
            return;
        }

        if (chantiers.length === 0) {
            console.log('❌ No chantiers found in database');
            return;
        }

        console.log(`✅ Found monteur: ${monteurs[0].prenom} ${monteurs[0].nom}`);
        console.log(`✅ Found chantier: ${chantiers[0].nom}\n`);

        // Try to create a feuille with minimal data
        const testData = {
            monteurId: monteurs[0].id,
            chantierId: chantiers[0].id,
            dateTravail: new Date(),
            heureDebut: '08:00',
            heureFin: '17:00',
            descriptionTravail: 'Test feuille creation'
        };

        console.log('Creating feuille with data:');
        console.log(JSON.stringify(testData, null, 2));
        console.log('');

        const feuille = await prisma.feuilleTravail.create({
            data: testData,
            include: {
                frais: true
            }
        });

        console.log('✅ SUCCESS! Feuille created:');
        console.log(`   ID: ${feuille.id}`);
        console.log(`   Statut: ${feuille.statut}`);
        console.log(`   Heures: ${feuille.heuresTotales}`);
        console.log('');

        // Clean up test data
        await prisma.feuilleTravail.delete({ where: { id: feuille.id } });
        console.log('🧹 Test feuille deleted');

    } catch (error) {
        console.error('❌ ERROR creating feuille:');
        console.error('   Message:', error.message);
        console.error('   Code:', error.code);
        if (error.meta) {
            console.error('   Meta:', JSON.stringify(error.meta, null, 2));
        }
        console.error('\nFull error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testFeuilleCreation();
