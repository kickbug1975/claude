const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/maintenance_db',
  });

  try {
    console.log('🔗 Tentative de connexion à PostgreSQL...\n');
    await client.connect();
    console.log('✅ Connexion réussie !\n');

    // Test 1: Compter les utilisateurs
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`👥 Utilisateurs: ${usersResult.rows[0].count}`);

    // Test 2: Compter les monteurs
    const monteursResult = await client.query('SELECT COUNT(*) as count FROM monteurs');
    console.log(`👷 Monteurs: ${monteursResult.rows[0].count}`);

    // Test 3: Compter les chantiers
    const chantiersResult = await client.query('SELECT COUNT(*) as count FROM chantiers');
    console.log(`🏗️ Chantiers: ${chantiersResult.rows[0].count}`);

    // Test 4: Compter les feuilles de travail
    const feuillesResult = await client.query('SELECT COUNT(*) as count FROM feuilles_travail');
    console.log(`📋 Feuilles de travail: ${feuillesResult.rows[0].count}`);

    // Test 5: Compter les frais
    const fraisResult = await client.query('SELECT COUNT(*) as count FROM frais');
    console.log(`💰 Frais: ${fraisResult.rows[0].count}`);

    console.log('\n✅ Tous les tests de connexion sont réussis !');
    console.log('\n📊 Base de données prête à être utilisée !');

  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testConnection();
