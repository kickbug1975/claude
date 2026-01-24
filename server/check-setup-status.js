const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatus() {
    try {
        const userCount = await prisma.maintenanceUser.count();
        const isSetup = userCount > 0;

        const monteurCount = await prisma.monteur.count();
        const chantierCount = await prisma.chantier.count();

        const company = await prisma.company.findFirst();

        console.log('API Response Simulation:');
        console.log(JSON.stringify({
            success: true,
            data: {
                isSetupComplete: isSetup,
                configured: isSetup,
                hasAdmin: userCount > 0,
                counts: {
                    monteurs: monteurCount,
                    chantiers: chantierCount
                },
                company: company || null,
                maintenanceMode: false,
                version: '1.0.0'
            }
        }, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkStatus();
