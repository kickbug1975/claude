import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seed de la base de données...')

  // 1. Nettoyer les données existantes (optionnel, à commenter en production)
  console.log('🧹 Nettoyage des données existantes...')
  await prisma.frais.deleteMany()
  await prisma.feuilleTravail.deleteMany()
  await prisma.user.deleteMany()
  await prisma.monteur.deleteMany()
  await prisma.chantier.deleteMany()

  // 2. Créer l'entreprise par défaut
  console.log('🏢 Création de l\'entreprise par défaut...')
  const company = await prisma.company.create({
    data: {
      name: 'Entreprise de Maintenance',
      isSetupComplete: true, // Pour le demo seed, on considère le setup fini
    },
  })

  // 3. Créer un utilisateur ADMIN par défaut
  console.log('👤 Création de l\'utilisateur admin...')
  const hashedPassword = await bcrypt.hash('Admin123!', 10)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@maintenance.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin créé:', admin.email)

  // 3. Créer des monteurs de test
  console.log('👷 Création des monteurs de test...')

  const monteur1 = await prisma.monteur.create({
    data: {
      nom: 'Dupont',
      prenom: 'Jean',
      telephone: '06 12 34 56 78',
      email: 'jean.dupont@maintenance.com',
      adresse: '123 Rue de la Paix, 75001 Paris',
      dateEmbauche: new Date('2023-01-15'),
      numeroIdentification: 'MON-001',
      actif: true,
    },
  })

  const monteur2 = await prisma.monteur.create({
    data: {
      nom: 'Martin',
      prenom: 'Sophie',
      telephone: '06 23 45 67 89',
      email: 'sophie.martin@maintenance.com',
      adresse: '456 Avenue des Champs, 75008 Paris',
      dateEmbauche: new Date('2023-03-20'),
      numeroIdentification: 'MON-002',
      actif: true,
    },
  })

  console.log('✅ Monteurs créés:', monteur1.nom, ',', monteur2.nom)

  // 4. Créer des utilisateurs pour les monteurs
  console.log('🔐 Création des comptes utilisateurs pour les monteurs...')

  const hashedPasswordMonteur = await bcrypt.hash('Monteur123!', 10)

  const userMonteur1 = await prisma.user.create({
    data: {
      email: 'jean.dupont@maintenance.com',
      password: hashedPasswordMonteur,
      role: 'MONTEUR',
      monteurId: monteur1.id,
    },
  })

  const userMonteur2 = await prisma.user.create({
    data: {
      email: 'sophie.martin@maintenance.com',
      password: hashedPasswordMonteur,
      role: 'MONTEUR',
      monteurId: monteur2.id,
    },
  })

  console.log('✅ Comptes monteurs créés')

  // 5. Créer un superviseur
  console.log('👨‍💼 Création du superviseur...')

  const superviseur = await prisma.user.create({
    data: {
      email: 'superviseur@maintenance.com',
      password: await bcrypt.hash('Superviseur123!', 10),
      role: 'SUPERVISEUR',
    },
  })

  console.log('✅ Superviseur créé:', superviseur.email)

  // 6. Créer des chantiers de test
  console.log('🏗️ Création des chantiers de test...')

  const chantier1 = await prisma.chantier.create({
    data: {
      nom: 'Rénovation Centre Commercial',
      adresse: '789 Boulevard du Commerce, 92100 Boulogne',
      client: 'Société Immobilière ABC',
      reference: 'CHANT-2024-001',
      dateDebut: new Date('2024-01-10'),
      dateFin: new Date('2024-06-30'),
      description: 'Rénovation complète du système électrique et de climatisation',
      actif: true,
    },
  })

  const chantier2 = await prisma.chantier.create({
    data: {
      nom: 'Installation Usine Lyon',
      adresse: '321 Zone Industrielle, 69007 Lyon',
      client: 'Industrie XYZ',
      reference: 'CHANT-2024-002',
      dateDebut: new Date('2024-02-01'),
      description: 'Installation de nouvelles lignes de production',
      actif: true,
    },
  })

  const chantier3 = await prisma.chantier.create({
    data: {
      nom: 'Maintenance Hôtel Paris',
      adresse: '555 Rue de Rivoli, 75001 Paris',
      client: 'Hôtels Prestige',
      reference: 'CHANT-2024-003',
      dateDebut: new Date('2024-03-15'),
      description: 'Maintenance préventive annuelle des équipements',
      actif: true,
    },
  })

  console.log('✅ Chantiers créés:', chantier1.nom, ',', chantier2.nom, ',', chantier3.nom)

  // 7. Créer des feuilles de travail de test
  console.log('📋 Création des feuilles de travail de test...')

  const feuille1 = await prisma.feuilleTravail.create({
    data: {
      monteurId: monteur1.id,
      chantierId: chantier1.id,
      dateTravail: new Date('2024-03-01'),
      heureDebut: '08:00',
      heureFin: '17:00',
      heuresTotales: 9,
      descriptionTravail: 'Installation des câblages électriques au 2ème étage. Travaux conformes aux normes.',
      statut: 'VALIDE',
      valideParId: superviseur.id,
    },
  })

  const feuille2 = await prisma.feuilleTravail.create({
    data: {
      monteurId: monteur2.id,
      chantierId: chantier2.id,
      dateTravail: new Date('2024-03-05'),
      heureDebut: '07:30',
      heureFin: '16:30',
      heuresTotales: 9,
      descriptionTravail: 'Mise en place des systèmes de ventilation et tests de fonctionnement.',
      statut: 'SOUMIS',
    },
  })

  const feuille3 = await prisma.feuilleTravail.create({
    data: {
      monteurId: monteur1.id,
      chantierId: chantier3.id,
      dateTravail: new Date('2024-03-10'),
      heureDebut: '09:00',
      heureFin: '18:00',
      heuresTotales: 9,
      descriptionTravail: 'Maintenance des équipements de climatisation et remplacement des filtres.',
      statut: 'BROUILLON',
    },
  })

  console.log('✅ Feuilles de travail créées')

  // 8. Créer des frais pour les feuilles
  console.log('💰 Création des frais de test...')

  await prisma.frais.createMany({
    data: [
      {
        feuilleId: feuille1.id,
        typeFrais: 'TRANSPORT',
        montant: 25.50,
        description: 'Déplacement Paris - Boulogne (A/R)',
      },
      {
        feuilleId: feuille1.id,
        typeFrais: 'REPAS',
        montant: 15.00,
        description: 'Déjeuner sur site',
      },
      {
        feuilleId: feuille2.id,
        typeFrais: 'TRANSPORT',
        montant: 120.00,
        description: 'Déplacement Paris - Lyon (train)',
      },
      {
        feuilleId: feuille2.id,
        typeFrais: 'MATERIEL',
        montant: 85.50,
        description: 'Achat de connecteurs spéciaux',
      },
      {
        feuilleId: feuille2.id,
        typeFrais: 'REPAS',
        montant: 18.50,
        description: 'Déjeuner',
      },
      {
        feuilleId: feuille3.id,
        typeFrais: 'TRANSPORT',
        montant: 12.00,
        description: 'Métro',
      },
    ],
  })

  console.log('✅ Frais créés')

  // Résumé
  console.log('\n📊 Résumé du seed:')
  const userCount = await prisma.user.count()
  const monteurCount = await prisma.monteur.count()
  const chantierCount = await prisma.chantier.count()
  const feuilleCount = await prisma.feuilleTravail.count()
  const fraisCount = await prisma.frais.count()

  console.log(`   - ${userCount} utilisateurs`)
  console.log(`   - ${monteurCount} monteurs`)
  console.log(`   - ${chantierCount} chantiers`)
  console.log(`   - ${feuilleCount} feuilles de travail`)
  console.log(`   - ${fraisCount} frais`)

  console.log('\n✅ Seed terminé avec succès!\n')
  console.log('🔐 Comptes de test créés:')
  console.log('   Admin: admin@maintenance.com / Admin123!')
  console.log('   Superviseur: superviseur@maintenance.com / Superviseur123!')
  console.log('   Monteur 1: jean.dupont@maintenance.com / Monteur123!')
  console.log('   Monteur 2: sophie.martin@maintenance.com / Monteur123!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
