const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupOrphans() {
    console.log('Cleaning up orphan monteur: kickbug1975@gmail.com');
    const result = await prisma.monteur.deleteMany({
        where: { email: 'kickbug1975@gmail.com' }
    });
    console.log(`Deleted ${result.count} orphan monteur(s).`);
}

cleanupOrphans().finally(() => prisma.$disconnect());
