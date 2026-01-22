
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUser() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'admin@maintenance.com' }
        });
        if (user) {
            console.log('USER_FOUND:', JSON.stringify(user, null, 2));
        } else {
            console.log('USER_NOT_FOUND');
        }
    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
