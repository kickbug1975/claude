// Script to clear test data while keeping users (login data)
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function clearTestData() {
    try {
        console.log('🗑️  Clearing test data from database...\n');

        // Delete in correct order (respecting foreign key constraints)

        // 1. Delete Fichiers (files)
        const deletedFichiers = await prisma.fichier.deleteMany({});
        console.log(`✅ Deleted ${deletedFichiers.count} fichiers`);

        // 2. Delete Frais (expenses)
        const deletedFrais = await prisma.frais.deleteMany({});
        console.log(`✅ Deleted ${deletedFrais.count} frais`);

        // 3. Delete FeuilleTravail (worksheets)
        const deletedFeuilles = await prisma.feuilleTravail.deleteMany({});
        console.log(`✅ Deleted ${deletedFeuilles.count} feuilles de travail`);

        // 4. Delete Chantiers (construction sites)
        const deletedChantiers = await prisma.chantier.deleteMany({});
        console.log(`✅ Deleted ${deletedChantiers.count} chantiers`);

        // 5. Delete Monteurs (workers)
        const deletedMonteurs = await prisma.monteur.deleteMany({});
        console.log(`✅ Deleted ${deletedMonteurs.count} monteurs`);

        console.log('\n✅ Database cleared successfully!');
        console.log('ℹ️  Users (login data) have been preserved.\n');

        // Show remaining users from both models
        const users = await prisma.user.findMany({
            select: {
                email: true,
                role: true,
                name: true
            }
        });

        const maintenanceUsers = await prisma.maintenanceUser.findMany({
            select: {
                email: true,
                role: true,
                nom: true,
                prenom: true
            }
        });

        console.log(`📋 Remaining Users (${users.length}):`);
        users.forEach(u => {
            console.log(`   - ${u.email} (${u.role}) - ${u.name || 'N/A'}`);
        });

        console.log(`\n📋 Remaining Maintenance Users (${maintenanceUsers.length}):`);
        maintenanceUsers.forEach(u => {
            console.log(`   - ${u.email} (${u.role}) - ${u.prenom || ''} ${u.nom || ''}`);
        });

    } catch (error) {
        console.error('❌ Error clearing database:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

clearTestData();
