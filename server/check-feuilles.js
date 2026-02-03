// Check for recent feuilles in database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentFeuilles() {
    try {
        console.log('🔍 Checking for recent feuilles de travail...\n');

        // Get all feuilles ordered by creation date
        const feuilles = await prisma.feuilleTravail.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                monteur: {
                    select: {
                        prenom: true,
                        nom: true,
                        numeroIdentification: true
                    }
                },
                chantier: {
                    select: {
                        nom: true,
                        reference: true
                    }
                },
                frais: true
            }
        });

        console.log(`Found ${feuilles.length} feuilles (showing last 10):\n`);

        feuilles.forEach((f, index) => {
            console.log(`[${index + 1}] Feuille ID: ${f.id}`);
            console.log(`    Created: ${f.createdAt}`);
            console.log(`    Date Travail: ${f.dateTravail}`);
            console.log(`    Monteur: ${f.monteur?.prenom} ${f.monteur?.nom} (${f.monteur?.numeroIdentification})`);
            console.log(`    Chantier: ${f.chantier?.nom} (${f.chantier?.reference})`);
            console.log(`    Statut: ${f.statut}`);
            console.log(`    Heures Matin: ${f.heuresMatin || 0}`);
            console.log(`    Heures Après-midi: ${f.heuresApresMidi || 0}`);
            console.log(`    Heures Déplace: ${f.heuresDeplace || 0}`);
            console.log(`    Frais: ${f.frais.length} items`);
            console.log('');
        });

        // Check the most recent one
        if (feuilles.length > 0) {
            const latest = feuilles[0];
            console.log('📋 MOST RECENT FEUILLE DETAILS:');
            console.log(JSON.stringify(latest, null, 2));
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecentFeuilles();
