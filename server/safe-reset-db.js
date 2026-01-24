const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDatabase() {
    const adminEmail = 'admin@maintenance.com';
    console.log(`=== RÉINITIALISATION BASE DE DONNÉES (Sauf ${adminEmail}) ===`);

    try {
        // 1. Supprimer les dépendances (Feuilles de travail, Frais, Fichiers)
        // Note: Cascade delete devrait gérer Frais/Fichiers si configuré, mais on nettoie explicitement
        console.log('Suppression des Feuilles de travail (et cascades)...');
        await prisma.frais.deleteMany({});
        await prisma.fichier.deleteMany({});
        await prisma.feuilleTravail.deleteMany({});

        // 2. Supprimer les Tokens (sauf pour l'admin si on voulait être précis, mais bon, on supprime tout pour etre propre)
        // On va supprimer TOUS les tokens pour éviter des orphelins
        console.log('Suppression des Tokens...');
        await prisma.maintenanceRefreshToken.deleteMany({});
        await prisma.maintenanceResetToken.deleteMany({});

        // 3. Supprimer les Utilisateurs SAUF Admin
        console.log('Suppression des Utilisateurs (sauf Admin)...');
        const deletedUsers = await prisma.maintenanceUser.deleteMany({
            where: {
                email: {
                    not: adminEmail
                }
            }
        });
        console.log(`${deletedUsers.count} utilisateurs supprimés.`);

        // 4. Détacher le lien monteur de l'admin s'il en a un (peu probable mais prudent)
        const admin = await prisma.maintenanceUser.findUnique({ where: { email: adminEmail } });
        if (admin && admin.monteurId) {
            await prisma.maintenanceUser.update({
                where: { email: adminEmail },
                data: { monteurId: null }
            });
        }

        // 5. Supprimer TOUS les Monteurs
        // (Maintenant que les users liés sont supprimés ou détachés)
        console.log('Suppression des Monteurs...');
        const deletedMonteurs = await prisma.monteur.deleteMany({});
        console.log(`${deletedMonteurs.count} monteurs supprimés.`);

        // 6. Supprimer TOUS les Chantiers
        console.log('Suppression des Chantiers...');
        const deletedChantiers = await prisma.chantier.deleteMany({});
        console.log(`${deletedChantiers.count} chantiers supprimés.`);

        console.log('\n✅ BASE DE DONNÉES NETTOYÉE AVEC SUCCÈS');
        console.log(`L'utilisateur ${adminEmail} a été conservé.`);

    } catch (error) {
        console.error('❌ ERREUR LORS DU NETTOYAGE:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetDatabase();
