const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function verifyLogin() {
    const email = 'admin@maintenance.com';
    const password = 'Admin123!';

    console.log(`Verifying login for ${email} with password '${password}'...`);

    const user = await prisma.maintenanceUser.findUnique({
        where: { email }
    });

    if (!user) {
        console.error('❌ User not found!');
        return;
    }

    console.log('User found:', user.email);
    console.log('Hash:', user.password);

    const isValid = await bcrypt.compare(password, user.password);
    console.log(`Password match: ${isValid ? '✅ YES' : '❌ NO'}`);
}

verifyLogin().finally(() => prisma.$disconnect());
