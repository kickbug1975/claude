const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMonteurLinks() {
    try {
        console.log('=== Vérification des liens Monteur-Utilisateur ===\n');

        // Récupérer tous les monteurs avec leurs utilisateurs liés
        const monteurs = await prisma.monteur.findMany({
            include: {
                maintenanceUser: true,
            }
        });

        console.log(`Nombre de monteurs: ${monteurs.length}\n`);

        monteurs.forEach((m, index) => {
            console.log(`${index + 1}. Monteur: ${m.prenom} ${m.nom} (${m.numeroIdentification})`);
            console.log(`   ID: ${m.id}`);
            console.log(`   Email: ${m.email}`);
            if (m.maintenanceUser) {
                console.log(`   ✓ Lié à utilisateur: ${m.maintenanceUser.email}`);
                console.log(`     User ID: ${m.maintenanceUser.id}`);
            } else {
                console.log(`   ✗ Pas lié à un utilisateur`);
            }
            console.log('');
        });

        // Récupérer tous les utilisateurs avec leurs monteurs liés
        console.log('\n=== Utilisateurs Maintenance ===\n');
        const users = await prisma.maintenanceUser.findMany({
            include: {
                monteur: true,
            }
        });

        console.log(`Nombre d'utilisateurs: ${users.length}\n`);

        users.forEach((u, index) => {
            console.log(`${index + 1}. Utilisateur: ${u.email}`);
            console.log(`   ID: ${u.id}`);
            console.log(`   Rôle: ${u.role}`);
            console.log(`   MonteurId: ${u.monteurId || 'NULL'}`);
            if (u.monteur) {
                console.log(`   ✓ Lié à monteur: ${u.monteur.prenom} ${u.monteur.nom} (${u.monteur.numeroIdentification})`);
            } else {
                console.log(`   ✗ Pas lié à un monteur`);
            }
            console.log('');
        });

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkMonteurLinks();
