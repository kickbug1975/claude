
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runMigration() {
    console.log('Running manual migration to add Enum values...');

    try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "TypeFrais" ADD VALUE 'TRANSPORT'`);
        console.log('✅ Added TRANSPORT');
    } catch (e) {
        console.log('ℹ️ TRANSPORT might already exist or error:', e.message);
    }

    try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "TypeFrais" ADD VALUE 'MATERIEL'`);
        console.log('✅ Added MATERIEL');
    } catch (e) {
        console.log('ℹ️ MATERIEL might already exist or error:', e.message);
    }

    try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "TypeFrais" ADD VALUE 'AUTRES'`);
        console.log('✅ Added AUTRES');
    } catch (e) {
        console.log('ℹ️ AUTRES might already exist or error:', e.message);
    }

    console.log('Migration finished.');
}

runMigration()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
