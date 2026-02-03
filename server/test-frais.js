
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFrais() {
    console.log('Testing creation with new Enum values...');

    const monteur = await prisma.monteur.findFirst();
    const chantier = await prisma.chantier.findFirst();

    if (!monteur || !chantier) {
        console.log('❌ Missing reference data');
        return;
    }

    try {
        const feuille = await prisma.feuilleTravail.create({
            data: {
                monteurId: monteur.id,
                chantierId: chantier.id,
                dateTravail: new Date(),
                heuresMatin: 4,
                statut: 'BROUILLON',
                frais: {
                    create: [
                        { type: 'TRANSPORT', montant: 50, description: 'Test Transport' },
                        { type: 'MATERIEL', montant: 100, description: 'Test Materiel' },
                        { type: 'AUTRES', montant: 10, description: 'Test Autres' }
                    ]
                }
            },
            include: { frais: true }
        });
        console.log('✅ Success! Created Feuille with new Enums:', feuille.id);
        console.log('Frais created:', feuille.frais.map(f => f.type));
    } catch (e) {
        console.error('❌ Failed to create:', e);
    }
}

testFrais()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
