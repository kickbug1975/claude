const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupUser() {
    try {
        const emailToRemove = 'info@maisonfumesse.be';

        console.log(`Recherche de l'utilisateur ${emailToRemove} dans maintenance_users...`);

        const user = await prisma.maintenanceUser.findUnique({
            where: { email: emailToRemove }
        });

        if (!user) {
            console.log(`✓ L'utilisateur ${emailToRemove} n'existe pas dans maintenance_users`);
            return;
        }

        console.log(`Utilisateur trouvé:`, user);
        console.log(`\nSuppression de l'utilisateur ${emailToRemove}...`);

        await prisma.maintenanceUser.delete({
            where: { email: emailToRemove }
        });

        console.log(`✓ Utilisateur ${emailToRemove} supprimé avec succès de maintenance_users`);

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupUser();
