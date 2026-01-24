const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestFeuille() {
    console.log('Listing all monteurs...');
    const monteurs = await prisma.monteur.findMany();

    if (monteurs.length === 0) {
        console.error('❌ No monteurs found!');
        return;
    }

    const monteur = monteurs[0];
    console.log(`✅ Using Monteur: ${monteur.nom} ${monteur.prenom} (${monteur.id})`);

    console.log('Finding a Chantier...');
    // Create a dummy chantier if none exists because we need one for the relation
    let chantier = await prisma.chantier.findFirst();
    if (!chantier) {
        console.log('No chantier found, creating a dummy one...');
        chantier = await prisma.chantier.create({
            data: {
                nom: 'Chantier Test Script',
                adresse: '123 Rue Test',
                client: 'Client Test',
                statut: 'EN_COURS',
                dateDebut: new Date()
            }
        });
    }
    console.log(`✅ Using Chantier: ${chantier.nom} (${chantier.id})`);

    console.log('Attempting to create FeuilleDeTravail...');
    try {
        const feuille = await prisma.feuilleTravail.create({
            data: {
                monteurId: monteur.id,
                chantierId: chantier.id,
                dateTravail: new Date(),
                heureDebut: '08:00',
                heureFin: '17:00',
                heuresMatin: 4,
                heuresApresMidi: 4,
                heuresDeplace: 0,
                descriptionTravail: 'Test creation via script backend',
                statut: 'BROUILLON',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
        console.log('✅ Success! Created Feuille:', feuille.id);
    } catch (error) {
        console.error('❌ Creation Failed:', error);
    }
}

createTestFeuille().finally(() => prisma.$disconnect());
