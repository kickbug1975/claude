const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function reproducePatchError() {
    try {
        console.log('=== Tentative de reproduction de l\'erreur UPDATE ===\n');

        // 1. Récupérer un utilisateur existant
        const user = await prisma.maintenanceUser.findFirst({
            where: { role: 'MONTEUR' }
        });

        if (!user) {
            console.log('Aucun utilisateur MONTEUR trouvé pour le test');
            return;
        }

        console.log(`Test sur l'utilisateur: ${user.email} (${user.id})`);

        // 2. Tenter une mise à jour avec des champs invalides (comme le fait le frontend)
        const updateData = {
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role,
            // Champs qui n'existent PAS dans MaintenanceUser
            telephone: '0600000000',
            adresse: 'Test adresse',
            numeroIdentification: 'TEST-001'
        };

        console.log('Données envoyées:', updateData);

        try {
            await prisma.maintenanceUser.update({
                where: { id: user.id },
                data: updateData
            });
            console.log('✅ Mise à jour réussie (Inattendu !)');
        } catch (error) {
            console.log('❌ Erreur capturée (Attendu !):');
            console.log(error.message);
        }

    } catch (error) {
        console.error('Erreur globale:', error);
    } finally {
        await prisma.$disconnect();
    }
}

reproducePatchError();
