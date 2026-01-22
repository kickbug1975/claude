
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdmin() {
    try {
        const email = 'admin@maintenance.com';
        const rawPassword = 'Admin123!';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const name = 'Admin';

        // Ensure role exists in Enum or use string if Prisma expects it
        // Our schema says Role.ADMIN

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: 'ADMIN',
                name
            },
            create: {
                email,
                password: hashedPassword,
                role: 'ADMIN',
                name,
                isActive: true
            }
        });

        console.log('ADMIN_CREATED:', JSON.stringify(user, null, 2));

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedAdmin();
