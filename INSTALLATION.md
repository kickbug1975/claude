# 🚀 Guide d'Installation - Application Maintenance

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** 18 ou supérieur ([Télécharger](https://nodejs.org/))
- **PostgreSQL** 14 ou supérieur ([Télécharger](https://www.postgresql.org/download/))
- **npm** ou **yarn** (inclus avec Node.js)
- **Git** ([Télécharger](https://git-scm.com/))

## 📥 Étape 1 : Installation du Projet

### 1.1 Cloner le repository

```bash
git clone <votre-repo-url>
cd maintenance-worksheet-app
```

### 1.2 Installer les dépendances

**Option A - Installation globale (recommandée):**
```bash
npm install
npm run install:all
```

**Option B - Installation manuelle:**
```bash
# Client
cd client
npm install

# Server
cd ../server
npm install
```

## 🗄️ Étape 2 : Configuration de PostgreSQL

### 2.1 Créer la base de données

Connectez-vous à PostgreSQL:
```bash
psql -U postgres
```

Créez la base de données:
```sql
CREATE DATABASE maintenance_db;
CREATE USER maintenance_user WITH ENCRYPTED PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE maintenance_db TO maintenance_user;
\q
```

### 2.2 Vérifier la connexion

```bash
psql -U maintenance_user -d maintenance_db -h localhost
```

## ⚙️ Étape 3 : Configuration du Serveur

### 3.1 Créer le fichier .env

```bash
cd server
cp .env.example .env
```

### 3.2 Éditer le fichier .env

Ouvrez `.env` et modifiez les valeurs:

```env
# Database
DATABASE_URL="postgresql://maintenance_user:votre_mot_de_passe@localhost:5432/maintenance_db"

# JWT (générez un secret sécurisé)
JWT_SECRET="votre-secret-tres-long-et-aleatoire-minimum-32-caracteres"
JWT_EXPIRES_IN=7d

# Application
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
```

**Pour générer un JWT_SECRET sécurisé:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.3 Initialiser Prisma

```bash
cd server

# Générer le client Prisma
npm run prisma:generate

# Exécuter les migrations (à faire après l'étape suivante)
# npm run prisma:migrate
```

## 🎨 Étape 4 : Configuration du Client

### 4.1 Créer le fichier .env

```bash
cd client
cp .env.example .env
```

Le contenu par défaut devrait suffire:
```env
VITE_API_URL=http://localhost:5000/api
```

## 🧪 Étape 5 : Tester l'Installation

### 5.1 Démarrer le serveur

```bash
cd server
npm run dev
```

Vous devriez voir:
```
╔═══════════════════════════════════════╗
║  🚀 Serveur démarré avec succès       ║
║                                       ║
║  📍 Port: 5000                        ║
║  🌍 Environnement: development        ║
║  🔗 URL: http://localhost:5000        ║
╚═══════════════════════════════════════╝
```

Testez: http://localhost:5000/health

### 5.2 Démarrer le client (nouveau terminal)

```bash
cd client
npm run dev
```

Vous devriez voir:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

Ouvrez: http://localhost:3000

## 🔧 Étape 6 : Configuration AWS S3 (Optionnel pour le développement)

### 6.1 Créer un compte AWS

1. Allez sur [AWS Console](https://aws.amazon.com/)
2. Créez un compte si vous n'en avez pas

### 6.2 Créer un bucket S3

```bash
# Via AWS CLI (si installé)
aws s3 mb s3://maintenance-files-dev

# Ou via la console AWS
```

### 6.3 Créer des credentials IAM

1. Allez dans IAM → Users → Add User
2. Attachez la policy `AmazonS3FullAccess`
3. Récupérez `Access Key ID` et `Secret Access Key`

### 6.4 Mettre à jour .env

```env
AWS_ACCESS_KEY_ID=VOTRE_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=VOTRE_SECRET_KEY
AWS_S3_BUCKET=maintenance-files-dev
AWS_REGION=eu-west-1
```

## 📧 Étape 7 : Configuration Email (Optionnel pour le développement)

### 7.1 Option 1 - Gmail

1. Activez la validation en 2 étapes sur votre compte Google
2. Générez un mot de passe d'application: [Guide](https://support.google.com/accounts/answer/185833)
3. Mettez à jour `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-application
SMTP_FROM=noreply@maintenance.com
```

### 7.2 Option 2 - Mailtrap (pour le développement)

1. Créez un compte sur [Mailtrap.io](https://mailtrap.io/)
2. Récupérez les credentials SMTP
3. Mettez à jour `.env`

## ✅ Vérification Finale

### Checklist:

- [ ] PostgreSQL installé et démarré
- [ ] Base de données `maintenance_db` créée
- [ ] Node.js 18+ installé
- [ ] Dépendances client installées
- [ ] Dépendances serveur installées
- [ ] Fichier `server/.env` configuré
- [ ] Fichier `client/.env` configuré (optionnel)
- [ ] Serveur démarre sans erreur (port 5000)
- [ ] Client démarre sans erreur (port 3000)
- [ ] http://localhost:5000/health retourne OK
- [ ] http://localhost:3000 affiche l'application

## 🚀 Démarrage Rapide (après installation)

### Mode développement - Les deux en parallèle:

```bash
npm run dev
```

### Mode développement - Séparément:

**Terminal 1 - Serveur:**
```bash
npm run dev:server
```

**Terminal 2 - Client:**
```bash
npm run dev:client
```

## 🐛 Résolution de Problèmes

### Erreur: "Cannot connect to database"

```bash
# Vérifiez que PostgreSQL est démarré
sudo service postgresql status

# Démarrez PostgreSQL si nécessaire
sudo service postgresql start

# Testez la connexion
psql -U maintenance_user -d maintenance_db
```

### Erreur: "Port 5000 already in use"

```bash
# Trouvez le processus utilisant le port
lsof -i :5000

# Tuez le processus
kill -9 <PID>

# Ou changez le port dans server/.env
PORT=5001
```

### Erreur: "Module not found"

```bash
# Supprimez node_modules et réinstallez
rm -rf node_modules package-lock.json
npm install
```

### Erreur Prisma

```bash
cd server

# Régénérez le client
npm run prisma:generate

# Si problème persiste, reset la BDD (ATTENTION: perte de données)
npx prisma migrate reset
```

## 📚 Prochaines Étapes

Une fois l'installation réussie, passez à:

1. **Phase 2**: Configuration de Prisma et migrations
2. **Phase 3**: Implémentation de l'authentification
3. **Phase 4**: Développement des fonctionnalités

Consultez le `README.md` pour plus de détails.

## 💡 Besoin d'Aide ?

Si vous rencontrez des problèmes:

1. Vérifiez les logs dans la console
2. Consultez la section "Résolution de Problèmes" ci-dessus
3. Vérifiez que toutes les variables d'environnement sont correctes

---

**Installation terminée avec succès ! 🎉**
