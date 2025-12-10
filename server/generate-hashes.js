const bcrypt = require('bcryptjs');

async function generateHashes() {
  const passwords = {
    admin: 'Admin123!',
    superviseur: 'Superviseur123!',
    monteur: 'Monteur123!'
  };

  console.log('Génération des hashes bcrypt...\n');

  for (const [key, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${key}: ${password}`);
    console.log(`Hash: ${hash}\n`);
  }
}

generateHashes().catch(console.error);
