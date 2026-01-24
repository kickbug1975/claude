const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFeuilles() {
    try {
        console.log('=== Vérification des feuilles de travail ===\n');

        // Récupérer toutes les feuilles
        const feuilles = await prisma.feuilleTravail.findMany({
            include: {
                monteur: true,
                chantier: true,
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10 // Les 10 dernières
        });

        console.log(`Nombre total de feuilles trouvées: ${feuilles.length}\n`);

        if (feuilles.length === 0) {
            console.log('❌ Aucune feuille de travail trouvée dans la base de données');
            return;
        }

        console.log('Dernières feuilles créées:\n');
        feuilles.forEach((f, index) => {
            console.log(`${index + 1}. Feuille ID: ${f.id}`);
            console.log(`   Date travail: ${f.dateTravail}`);
            console.log(`   Statut: ${f.statut}`);
            console.log(`   Monteur: ${f.monteur ? `${f.monteur.prenom} ${f.monteur.nom}` : 'NON LIÉ'}`);
            console.log(`   MonteurId: ${f.monteurId || 'NULL'}`);
            console.log(`   Chantier: ${f.chantier ? f.chantier.nom : 'NON LIÉ'}`);
            console.log(`   ChantierId: ${f.chantierId || 'NULL'}`);
            console.log(`   Créée le: ${f.createdAt}`);
            console.log('');
        });

        // Vérifier les monteurs disponibles
        console.log('\n=== Monteurs disponibles ===\n');
        const monteurs = await prisma.monteur.findMany({
            include: {
                maintenanceUser: true,
            }
        });

        console.log(`Nombre de monteurs: ${monteurs.length}\n`);
        monteurs.forEach((m, index) => {
            console.log(`${index + 1}. ${m.prenom} ${m.nom} (${m.numeroIdentification})`);
            console.log(`   ID: ${m.id}`);
            console.log(`   Email: ${m.email}`);
            console.log(`   Lié à utilisateur: ${m.maintenanceUser ? m.maintenanceUser.email : 'NON'}`);
            console.log('');
        });

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkFeuilles();
