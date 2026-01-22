const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Testing database connection...\n');

    try {
        // Test de connexion
        await prisma.$connect();
        console.log('✅ Successfully connected to database\n');

        // Test de création d'utilisateur
        console.log('📝 Creating test user...');
        const user = await prisma.user.create({
            data: {
                email: `test-${Date.now()}@example.com`,
                password: 'hashed_password_here',
                name: 'Test User',
                role: 'USER'
            }
        });
        console.log('✅ Created user:', {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        });
        console.log('');

        // Test de création d'une tâche de maintenance
        console.log('📝 Creating test maintenance task...');
        const task = await prisma.maintenanceTask.create({
            data: {
                title: 'Test Maintenance Task',
                description: 'This is a test task created by the database connection test',
                status: 'PENDING',
                priority: 'MEDIUM'
            }
        });
        console.log('✅ Created task:', {
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority
        });
        console.log('');

        // Récupérer tous les utilisateurs
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });
        console.log(`✅ Total users in database: ${users.length}`);
        console.log('');

        // Récupérer toutes les tâches
        const tasks = await prisma.maintenanceTask.findMany({
            select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                createdAt: true
            }
        });
        console.log(`✅ Total maintenance tasks in database: ${tasks.length}`);
        console.log('');

        console.log('🎉 All tests passed successfully!');

    } catch (error) {
        console.error('❌ Error during database test:', error.message);
        console.error('\n💡 Make sure:');
        console.error('   1. PostgreSQL database is running');
        console.error('   2. DATABASE_URL in .env is correct');
        console.error('   3. You have run: npx prisma db push or npx prisma migrate dev');
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error('❌ Unexpected error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log('\n👋 Disconnected from database');
    });
