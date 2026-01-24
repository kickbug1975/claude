const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
    const users = await prisma.maintenanceUser.findMany({
        select: { id: true, email: true, role: true }
    });
    console.log('Utilisateurs trouvés:', users);
}

listUsers()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
