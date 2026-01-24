const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrphans() {
    const emailToCheck = 'kickbug1975@gmail.com';
    const idToCheck = 'MTR-001';

    console.log(`Checking for ${emailToCheck} and ${idToCheck}...`);

    const user = await prisma.maintenanceUser.findFirst({
        where: { email: emailToCheck }
    });
    console.log('User found:', user);

    const monteurByEmail = await prisma.monteur.findFirst({
        where: { email: emailToCheck }
    });
    console.log('Monteur found (by email):', monteurByEmail);

    const monteurById = await prisma.monteur.findFirst({
        where: { numeroIdentification: idToCheck }
    });
    console.log('Monteur found (by ID):', monteurById);

    if (user && monteurByEmail) {
        console.log('User and Monteur exist.');
    } else if (monteurByEmail && !user) {
        console.log('⚠️ ORPHAN DETECTED: Monteur exists but User does not.');
        console.log('This explains why 409 occurs when retrying creation!');
    } else if (user && !monteurByEmail) {
        console.log('User exists without Monteur (odd for role MONTEUR with same email).');
    } else {
        console.log('Nothing found. 409 might be due to race condition or other data.');
    }
}

checkOrphans().finally(() => prisma.$disconnect());
