// Test hours calculation logic
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function (same as in feuilleRoutes.ts)
const calculateHours = (heureDebut, heureFin) => {
    if (!heureDebut || !heureFin) return 0;

    const [startH, startM] = heureDebut.split(':').map(Number);
    const [endH, endM] = heureFin.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const diffMinutes = endMinutes - startMinutes;
    const totalHours = diffMinutes / 60;

    // Subtract 1 hour for lunch break
    return Math.max(0, totalHours - 1);
};

async function testHoursCalculation() {
    try {
        console.log('🧪 Testing hours calculation logic...\n');

        // Test cases
        const testCases = [
            { heureDebut: '08:00', heureFin: '17:00', expected: 8 },  // 9h - 1h = 8h
            { heureDebut: '09:00', heureFin: '18:00', expected: 8 },  // 9h - 1h = 8h
            { heureDebut: '08:00', heureFin: '12:00', expected: 3 },  // 4h - 1h = 3h
            { heureDebut: '14:00', heureFin: '18:00', expected: 3 },  // 4h - 1h = 3h
            { heureDebut: '08:30', heureFin: '17:30', expected: 8 },  // 9h - 1h = 8h
        ];

        console.log('📊 Testing calculation function:');
        testCases.forEach(({ heureDebut, heureFin, expected }) => {
            const result = calculateHours(heureDebut, heureFin);
            const status = result === expected ? '✅' : '❌';
            console.log(`${status} ${heureDebut} → ${heureFin} = ${result}h (expected ${expected}h)`);
        });

        console.log('\n🗄️  Testing database creation:\n');

        const monteurs = await prisma.monteur.findMany({ take: 1 });
        const chantiers = await prisma.chantier.findMany({ take: 1 });

        if (monteurs.length === 0 || chantiers.length === 0) {
            console.log('❌ No monteurs or chantiers found');
            return;
        }

        const testData = {
            monteurId: monteurs[0].id,
            chantierId: chantiers[0].id,
            dateTravail: new Date(),
            heureDebut: '08:00',
            heureFin: '17:00',
            heuresTotales: calculateHours('08:00', '17:00'),
            descriptionTravail: 'Test hours calculation'
        };

        console.log(`Creating feuille: ${testData.heureDebut} → ${testData.heureFin}`);
        console.log(`Expected heuresTotales: ${testData.heuresTotales}h\n`);

        const feuille = await prisma.feuilleTravail.create({
            data: testData
        });

        console.log('✅ Feuille created successfully!');
        console.log(`   ID: ${feuille.id}`);
        console.log(`   Heures: ${feuille.heuresTotales}h`);
        console.log(`   Status: ${feuille.statut}`);

        // Cleanup
        await prisma.feuilleTravail.delete({ where: { id: feuille.id } });
        console.log('\n🧹 Test feuille deleted');

        console.log('\n🎉 All tests passed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

testHoursCalculation();
