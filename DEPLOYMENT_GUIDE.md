# Guide de Déploiement PostgreSQL et Prisma sur Render

## 📋 Résumé

Ce guide vous accompagne pour déployer votre application Claude avec PostgreSQL sur Render et intégrer Prisma ORM.

## ✅ Fichiers Créés

Les fichiers suivants ont été créés et configurés :

1. **`server/package.json`** - Configuration npm avec dépendances Prisma
2. **`server/prisma/schema.prisma`** - Schéma de base de données Prisma
3. **`server/src/config/prisma.ts`** - Module de configuration Prisma
4. **`render.yaml`** - Configuration Blueprint Render
5. **`server/.env.example`** - Template des variables d'environnement

## 🚀 Étapes de Déploiement

### Étape 1: Créer la Base de Données sur Render

1. **Connectez-vous au Dashboard Render** : https://dashboard.render.com
2. **Créez une nouvelle base de données PostgreSQL** :
   - Cliquez sur "New +" → "PostgreSQL"
   - **Name**: `claude-postgres-db`
   - **Database**: `maintenance_db`
   - **User**: `postgres`
   - **Region**: Frankfurt (ou votre préférence)
   - **Plan**: Free
3. **Copiez l'URL de connexion interne** :
   - Une fois créée, allez dans l'onglet "Info"
   - Copiez la valeur "Internal Database URL"
   - Format: `postgresql://user:password@host:port/database`

### Étape 2: Configurer les Variables d'Environnement

Mettez à jour le fichier `server/.env` avec l'URL de connexion Render :

```bash
DATABASE_URL="postgresql://user:password@host:port/database"
```

> ⚠️ **Important**: Remplacez l'URL complète par celle copiée depuis Render

### Étape 3: Installer les Dépendances

```bash
cd c:\Users\Dimitri\claude\server
npm install
```

### Étape 4: Générer le Client Prisma

```bash
npx prisma generate
```

Cette commande génère le client Prisma TypeScript basé sur votre schéma.

### Étape 5: Créer et Appliquer les Migrations

```bash
# Créer la migration initiale
npx prisma migrate dev --name init

# Ou pousser le schéma directement (pour développement rapide)
npx prisma db push
```

### Étape 6: Vérifier avec Prisma Studio

```bash
npx prisma studio
```

Cela ouvrira une interface web pour visualiser et gérer vos données.

### Étape 7: Déployer sur Render (Optionnel)

#### Option A: Déploiement via Blueprint (Recommandé)

1. Poussez votre code sur GitHub
2. Dans Render Dashboard, cliquez sur "New +" → "Blueprint"
3. Connectez votre repository GitHub
4. Render détectera automatiquement le fichier `render.yaml`
5. Cliquez sur "Apply" pour déployer

#### Option B: Déploiement Manuel

1. **Créer le service Web** :
   - New + → Web Service
   - Connectez votre repo GitHub
   - **Build Command**: `cd server && npm install && npx prisma generate && npm run build`
   - **Start Command**: `cd server && npm start`
   - Ajoutez les variables d'environnement

2. **Lier la base de données** :
   - Dans les variables d'environnement du service web
   - Ajoutez `DATABASE_URL` et sélectionnez votre base PostgreSQL

## 🧪 Tests Locaux

### Test de Connexion

Créez un fichier de test `server/test-db.js` :

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing database connection...');
  
  // Test de connexion
  await prisma.$connect();
  console.log('✅ Connected to database');
  
  // Test de création d'utilisateur
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: 'hashed_password',
      name: 'Test User',
      role: 'USER'
    }
  });
  console.log('✅ Created user:', user);
  
  // Récupérer tous les utilisateurs
  const users = await prisma.user.findMany();
  console.log('✅ All users:', users);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Exécutez le test :

```bash
node server/test-db.js
```

## 📝 Modèles Prisma Disponibles

Le schéma actuel inclut :

### User
- `id`: UUID
- `email`: String (unique)
- `password`: String
- `name`: String (optionnel)
- `role`: Enum (USER, ADMIN, MODERATOR)
- `createdAt`, `updatedAt`: DateTime

### MaintenanceTask
- `id`: UUID
- `title`: String
- `description`: String (optionnel)
- `status`: Enum (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- `priority`: Enum (LOW, MEDIUM, HIGH, URGENT)
- `assignedTo`: String (optionnel)
- `createdAt`, `updatedAt`, `completedAt`: DateTime

## 🔧 Commandes Prisma Utiles

```bash
# Générer le client Prisma
npx prisma generate

# Créer une migration
npx prisma migrate dev --name description_migration

# Appliquer les migrations en production
npx prisma migrate deploy

# Pousser le schéma sans migration (dev)
npx prisma db push

# Réinitialiser la base de données
npx prisma migrate reset

# Ouvrir Prisma Studio
npx prisma studio

# Formater le schéma
npx prisma format
```

## 🔐 Sécurité

> ⚠️ **Ne jamais commiter le fichier `.env`** dans Git !

Le fichier `.gitignore` devrait contenir :
```
.env
node_modules/
dist/
```

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation Render](https://render.com/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

## ✨ Prochaines Étapes

1. ✅ Créer la base de données sur Render
2. ✅ Configurer DATABASE_URL dans `.env`
3. ✅ Installer les dépendances
4. ✅ Générer le client Prisma
5. ✅ Créer les migrations
6. ✅ Tester localement
7. 🚀 Déployer sur Render
