const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMaintenanceAdmin() {
    console.log('Checking MaintenanceUser table...');
    const count = await prisma.maintenanceUser.count();
    console.log('Total MaintenanceUsers:', count);

    const admin = await prisma.maintenanceUser.findUnique({
        where: { email: 'admin@maintenance.com' }
    });
    console.log('Admin user:', admin);
}

checkMaintenanceAdmin().finally(() => prisma.$disconnect());
