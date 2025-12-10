# 🗄️ Configuration de la Base de Données PostgreSQL

## 📋 Prérequis

Assurez-vous que PostgreSQL est installé et en cours d'exécution sur votre système.

### Vérifier l'installation de PostgreSQL

```bash
psql --version
```

### Démarrer PostgreSQL

**Linux:**
```bash
sudo service postgresql start
# ou
sudo systemctl start postgresql
```

**macOS:**
```bash
brew services start postgresql
```

**Windows:**
PostgreSQL démarre automatiquement, sinon utilisez le gestionnaire de services.

## 🔧 Étape 1 : Créer la Base de Données

### 1.1 Se connecter à PostgreSQL en tant qu'administrateur

```bash
# Linux/Mac
sudo -u postgres psql

# Ou directement
psql -U postgres
```

### 1.2 Créer la base de données et l'utilisateur

```sql
-- Créer la base de données
CREATE DATABASE maintenance_db;

-- Créer un utilisateur (optionnel, vous pouvez utiliser postgres)
CREATE USER maintenance_user WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Donner tous les privilèges sur la base de données
GRANT ALL PRIVILEGES ON DATABASE maintenance_db TO maintenance_user;

-- Si vous utilisez PostgreSQL 15+, donnez également les privilèges sur le schéma
\c maintenance_db
GRANT ALL ON SCHEMA public TO maintenance_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO maintenance_user;

-- Quitter psql
\q
```

### 1.3 Tester la connexion

```bash
# Avec l'utilisateur créé
psql -U maintenance_user -d maintenance_db -h localhost

# Ou avec l'utilisateur postgres par défaut
psql -U postgres -d maintenance_db
```

## ⚙️ Étape 2 : Configurer les Variables d'Environnement

### 2.1 Vérifier le fichier .env

Le fichier `.env` a déjà été créé dans `server/.env`. Vérifiez et modifiez la variable `DATABASE_URL` si nécessaire :

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/maintenance_db?schema=public"
```

**Format:**
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
```

**Exemples:**

```env
# Avec l'utilisateur postgres (par défaut)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/maintenance_db?schema=public"

# Avec un utilisateur personnalisé
DATABASE_URL="postgresql://maintenance_user:your_password@localhost:5432/maintenance_db?schema=public"

# Avec un hôte distant
DATABASE_URL="postgresql://user:pass@db.example.com:5432/maintenance_db?schema=public"
```

## 🚀 Étape 3 : Installer les Dépendances

```bash
cd server
npm install
```

## 📊 Étape 4 : Générer le Client Prisma

```bash
cd server
npm run prisma:generate
```

Cette commande génère le client Prisma basé sur votre schéma.

## 🗃️ Étape 5 : Créer les Migrations

```bash
cd server
npm run prisma:migrate
```

Vous serez invité à donner un nom à votre migration. Suggestions :
- `init` - Pour la première migration
- `initial_schema` - Nom descriptif

Cette commande va :
1. Créer les tables dans la base de données
2. Générer les fichiers de migration dans `prisma/migrations/`
3. Appliquer les migrations

## 🌱 Étape 6 : Seed de la Base de Données (Données de Test)

```bash
cd server
npm run prisma:seed
```

Cette commande va créer :

### Utilisateurs de test:
- **Admin:** `admin@maintenance.com` / `Admin123!`
- **Superviseur:** `superviseur@maintenance.com` / `Superviseur123!`
- **Monteur 1:** `jean.dupont@maintenance.com` / `Monteur123!`
- **Monteur 2:** `sophie.martin@maintenance.com` / `Monteur123!`

### Données de test:
- 2 monteurs (Jean Dupont, Sophie Martin)
- 3 chantiers actifs
- 3 feuilles de travail avec différents statuts
- 6 frais associés aux feuilles

## ✅ Étape 7 : Vérifier l'Installation

### 7.1 Via Prisma Studio (Interface graphique)

```bash
cd server
npm run prisma:studio
```

Ouvre une interface web sur `http://localhost:5555` pour explorer vos données.

### 7.2 Via le serveur

```bash
cd server
npm run dev
```

Testez l'endpoint de santé :
```bash
curl http://localhost:5000/health
```

Réponse attendue :
```json
{
  "status": "OK",
  "message": "Server is running",
  "database": "Connected",
  "environment": "development",
  "timestamp": "2024-03-XX..."
}
```

### 7.3 Via psql (ligne de commande)

```bash
psql -U postgres -d maintenance_db

-- Vérifier les tables
\dt

-- Compter les utilisateurs
SELECT COUNT(*) FROM users;

-- Voir les monteurs
SELECT * FROM monteurs;

-- Quitter
\q
```

## 🔄 Commandes Utiles

### Régénérer le client Prisma
```bash
npm run prisma:generate
```

### Créer une nouvelle migration
```bash
npm run prisma:migrate
```

### Appliquer les migrations (production)
```bash
npm run prisma:migrate:prod
```

### Ouvrir Prisma Studio
```bash
npm run prisma:studio
```

### Réinitialiser complètement la base de données (⚠️ PERTE DE DONNÉES)
```bash
npm run prisma:reset
```

Cette commande va :
1. Supprimer toutes les données
2. Supprimer toutes les tables
3. Re-créer les tables
4. Exécuter le seed

### Configuration complète en une commande
```bash
npm run db:setup
```

Exécute : generate → migrate → seed

## 🐛 Résolution de Problèmes

### Erreur: "Connection refused"

PostgreSQL n'est pas démarré :
```bash
sudo service postgresql start
```

### Erreur: "role does not exist"

L'utilisateur n'existe pas. Créez-le :
```sql
CREATE USER maintenance_user WITH PASSWORD 'password';
```

### Erreur: "database does not exist"

La base de données n'existe pas. Créez-la :
```sql
CREATE DATABASE maintenance_db;
```

### Erreur: "password authentication failed"

Mot de passe incorrect dans `DATABASE_URL`. Vérifiez le fichier `.env`.

### Erreur: "permission denied for schema public"

PostgreSQL 15+ nécessite des permissions explicites :
```sql
\c maintenance_db
GRANT ALL ON SCHEMA public TO maintenance_user;
```

### Voir les erreurs Prisma en détail

```bash
# Activer les logs détaillés
export DEBUG="prisma:*"
npm run dev
```

### Réinitialiser complètement

Si vous rencontrez des problèmes majeurs :

1. **Supprimer la base de données :**
```sql
DROP DATABASE maintenance_db;
CREATE DATABASE maintenance_db;
```

2. **Supprimer le dossier migrations :**
```bash
rm -rf server/prisma/migrations
```

3. **Re-créer tout :**
```bash
cd server
npm run db:setup
```

## 📊 Schéma de Base de Données

### Tables créées

1. **users** - Utilisateurs (Admin, Superviseur, Monteur)
2. **monteurs** - Informations sur les monteurs
3. **chantiers** - Informations sur les chantiers
4. **feuilles_travail** - Feuilles de travail
5. **frais** - Frais associés aux feuilles

### Relations

```
User 1---0..1 Monteur
Monteur 1---* FeuilleTravail
Chantier 1---* FeuilleTravail
FeuilleTravail 1---* Frais
User 1---* FeuilleTravail (validateur)
```

## 🔐 Sécurité

### En Développement

Le fichier `.env` contient :
- URL de connexion locale
- JWT secret de développement
- Credentials de test

### En Production

**À FAIRE ABSOLUMENT :**

1. ✅ Changer tous les mots de passe
2. ✅ Utiliser un JWT_SECRET fort (32+ caractères aléatoires)
3. ✅ Configurer PostgreSQL avec SSL
4. ✅ Ne jamais committer le fichier `.env`
5. ✅ Utiliser des variables d'environnement sécurisées

```bash
# Générer un JWT secret sécurisé
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)

## ✅ Checklist Finale

Avant de passer à la suite, vérifiez que :

- [ ] PostgreSQL est installé et démarré
- [ ] La base de données `maintenance_db` existe
- [ ] Le fichier `server/.env` est configuré correctement
- [ ] Les dépendances sont installées (`npm install`)
- [ ] Le client Prisma est généré (`npm run prisma:generate`)
- [ ] Les migrations sont appliquées (`npm run prisma:migrate`)
- [ ] Les données de test sont chargées (`npm run prisma:seed`)
- [ ] Le serveur démarre sans erreur (`npm run dev`)
- [ ] L'endpoint `/health` retourne `"database": "Connected"`
- [ ] Prisma Studio fonctionne (`npm run prisma:studio`)

---

**🎉 Félicitations ! Votre base de données est prête !**

Passez maintenant à l'implémentation de l'authentification JWT.
