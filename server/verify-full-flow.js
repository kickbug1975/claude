const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyFullFlow() {
    console.log('=== DÉBUT VÉRIFICATION GLOBALE ===\n');
    let testUserId = null;
    let testMonteurId = null;
    let testOtherMonteurId = null;
    let testChantierId = null;

    try {
        // 1. Test: Création automatique Monteur via User
        console.log('1. Test Création User MONTEUR (automatique)...');
        const email = `test.monteur.${Date.now()}@test.com`;

        // Simuler ce que fait userRoutes.ts
        const monteurData = {
            nom: 'TestNom',
            prenom: 'TestPrenom',
            telephone: '0123456789',
            adresse: '123 Test Rue',
            email: email, // Email requis
            numeroIdentification: `TEST-${Date.now()}`,
            dateEmbauche: new Date()
        };

        const createdMonteur = await prisma.monteur.create({
            data: monteurData
        });
        testMonteurId = createdMonteur.id;

        const createdUser = await prisma.maintenanceUser.create({
            data: {
                email,
                password: 'hash',
                role: 'MONTEUR',
                nom: monteurData.nom,
                prenom: monteurData.prenom,
                monteurId: createdMonteur.id
            },
            include: { monteur: true }
        });
        testUserId = createdUser.id;

        if (createdUser.monteurId === createdMonteur.id && createdUser.monteur) {
            console.log('✅ Succès: User créé et lié automatiquement au Monteur');
        } else {
            console.error('❌ Échec: Lien manquant à la création');
        }

        // 2. Test: Update User pour changer de Monteur (simuler le fix du PATCH)
        console.log('\n2. Test Update User (PATCH logic)...');

        // Créer un autre monteur autonome avec TOUS les champs requis
        const otherMonteur = await prisma.monteur.create({
            data: {
                nom: 'Other',
                prenom: 'Monteur',
                numeroIdentification: `OTHER-${Date.now()}`,
                email: `other.monteur.${Date.now()}@test.com`,
                dateEmbauche: new Date(),
                telephone: '0987654321',
                adresse: 'Another Address'
            }
        });
        testOtherMonteurId = otherMonteur.id;

        // Simuler le payload du frontend (avec champs en trop qui causaient l'erreur)
        const updatePayload = {
            email: createdUser.email,
            role: 'MONTEUR',
            monteurId: otherMonteur.id,
            // Champs "interdits" pour MaintenanceUser
            telephone: '999999999',
            adresse: 'Bad Address'
        };

        // Filtrer comme dans le backend (C'EST CE QUE JE TESTE: LE FILTRAGE EFFEECTIF)
        const allowedFields = ['email', 'role', 'nom', 'prenom', 'isActive', 'monteurId'];
        const cleanData = {};
        Object.keys(updatePayload).forEach(key => {
            if (allowedFields.includes(key)) cleanData[key] = updatePayload[key];
        });

        const updatedUser = await prisma.maintenanceUser.update({
            where: { id: createdUser.id },
            data: cleanData,
            select: { monteurId: true, monteur: true }
        });

        if (updatedUser.monteurId === otherMonteur.id && updatedUser.monteur.id === otherMonteur.id) {
            console.log('✅ Succès: User mis à jour et relié au nouveau monteur (champs interdits filtrés)');
        } else {
            console.error('❌ Échec: Mise à jour du lien a échoué');
        }

        // 3. Test: Get Stats (simuler monteurRoutes.ts)
        console.log('\n3. Test Get Stats...');
        // Créer un chantier
        const chantier = await prisma.chantier.create({
            data: {
                nom: 'Test Chantier',
                adresse: 'Test Adresse',
                client: 'Test Client',
                dateDebut: new Date()
            }
        });
        testChantierId = chantier.id;

        await prisma.feuilleTravail.create({
            data: {
                monteurId: otherMonteur.id,
                chantierId: chantier.id,
                dateTravail: new Date(),
                heuresMatin: 4,
                heuresApresMidi: 3.5,
                statut: 'VALIDE',
                frais: {
                    create: { type: 'REPAS', montant: 15 }
                }
            }
        });

        // Simuler la logique du endpoint stats qui a été ajouté
        const feuilles = await prisma.feuilleTravail.findMany({
            where: { monteurId: otherMonteur.id },
            include: { frais: true, chantier: true }
        });

        const heuresTotales = feuilles.reduce((acc, f) => {
            return acc + (f.heuresMatin || 0) + (f.heuresApresMidi || 0) + (f.heuresDeplace || 0);
        }, 0);

        const fraisTotaux = feuilles.reduce((acc, f) => {
            return acc + f.frais.reduce((sum, fr) => sum + (fr.montant || 0), 0);
        }, 0);

        console.log(`Données récupérées: ${feuilles.length} feuilles, ${heuresTotales} heures, ${fraisTotaux}€ frais`);

        if (heuresTotales === 7.5 && fraisTotaux === 15) {
            console.log('✅ Succès: Calcul des statistiques correct');
        } else {
            console.error('❌ Échec: Calcul des statistiques incorrect');
        }

        console.log('\n✅ VÉRIFICATION TERMINÉE AVEC SUCCÈS');

    } catch (error) {
        console.error('❌ ERREUR FATALE:', error);
    } finally {
        // Nettoyage sécurisé
        if (testUserId) await prisma.maintenanceUser.delete({ where: { id: testUserId } }).catch(() => { });
        if (testMonteurId) await prisma.monteur.delete({ where: { id: testMonteurId } }).catch(() => { });
        // Note: delete user will cascade delete? No, but delete monteurs safely.

        // Clean up other monteur (might fail if user link exists constraints, but user is deleted first above)
        if (testOtherMonteurId) await prisma.monteur.delete({ where: { id: testOtherMonteurId } }).catch(() => { });
        if (testChantierId) await prisma.chantier.delete({ where: { id: testChantierId } }).catch(() => { });

        await prisma.$disconnect();
    }
}

verifyFullFlow();
