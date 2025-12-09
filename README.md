# 📋 Application de Gestion de Feuilles de Travail - Maintenance

Application web complète pour la gestion des feuilles de travail des équipes de maintenance, avec gestion des monteurs, chantiers, frais et exports PDF.

## 🚀 Stack Technologique

### Frontend
- **React 18+** avec TypeScript
- **Tailwind CSS** pour le styling
- **Vite** comme bundler
- **React Router** pour la navigation
- **Zustand** pour la gestion d'état
- **React Hook Form** pour les formulaires
- **jsPDF** pour l'export PDF

### Backend
- **Node.js + Express** avec TypeScript
- **PostgreSQL** comme base de données
- **Prisma ORM** pour la gestion de la BDD
- **JWT** pour l'authentification
- **AWS S3** pour le stockage des fichiers
- **Nodemailer** pour les notifications email
- **Node-cron** pour les rappels automatiques

## 📁 Structure du Projet

```
maintenance-worksheet-app/
├── client/                 # Application React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API calls
│   │   ├── store/          # State management
│   │   ├── utils/          # Utilitaires
│   │   └── types/          # Types TypeScript
│   └── package.json
│
├── server/                 # API Node.js
│   ├── src/
│   │   ├── controllers/    # Logique métier
│   │   ├── middlewares/    # Middlewares Express
│   │   ├── routes/         # Routes API
│   │   ├── services/       # Services (email, upload)
│   │   ├── utils/          # Utilitaires
│   │   └── config/         # Configuration
│   └── package.json
│
└── README.md
```

## ⚙️ Installation

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### 1. Cloner le repository
```bash
git clone <repo-url>
cd maintenance-worksheet-app
```

### 2. Installation des dépendances

**Client:**
```bash
cd client
npm install
```

**Server:**
```bash
cd server
npm install
```

### 3. Configuration des variables d'environnement

**Server (.env):**
```bash
cd server
cp .env.example .env
# Éditer .env avec vos valeurs
```

Variables importantes:
- `DATABASE_URL`: URL de connexion PostgreSQL
- `JWT_SECRET`: Secret pour les tokens JWT
- `AWS_*`: Credentials pour AWS S3
- `SMTP_*`: Configuration email

### 4. Configuration de la base de données

```bash
cd server
npm run prisma:generate
npm run prisma:migrate
```

## 🚀 Démarrage

### Mode Développement

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```
Serveur accessible sur `http://localhost:5000`

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```
Application accessible sur `http://localhost:3000`

### Mode Production

**Build:**
```bash
# Client
cd client
npm run build

# Server
cd server
npm run build
```

**Start:**
```bash
cd server
npm start
```

## 👥 Rôles et Permissions

### 🔧 ADMIN
- Gestion complète des utilisateurs
- Gestion des monteurs (CRUD)
- Gestion des chantiers (CRUD)
- Accès à toutes les fonctionnalités

### 👨‍💼 SUPERVISEUR
- Visualisation de toutes les feuilles de travail
- Validation/rejet des feuilles
- Dashboard statistiques global
- Export PDF

### 👤 MONTEUR
- Création de feuilles de travail
- Consultation de ses feuilles
- Upload de preuves de frais
- Réception de notifications

## 📊 Fonctionnalités Principales

### ✅ Gestion des Feuilles de Travail
- Formulaire de saisie complet
- Calcul automatique des heures totales
- Gestion multi-frais (transport, matériel, repas, autres)
- Upload de preuves (images, PDF, max 10MB)
- Statuts: Brouillon → Soumis → Validé/Rejeté

### ✅ Dashboard & Statistiques
- Monteurs: heures travaillées, chantiers, frais
- Superviseurs: feuilles en attente, tendances, répartition

### ✅ Export PDF
- Génération PDF des feuilles de travail
- Inclut toutes les informations et frais

### ✅ Notifications
- Email de confirmation après soumission
- Email de validation/rejet
- Rappels automatiques programmés

## 🔐 Sécurité

- ✅ Hash des mots de passe (bcrypt)
- ✅ Authentification JWT avec refresh tokens
- ✅ Protection CORS
- ✅ Rate limiting
- ✅ Validation des entrées (Zod)
- ✅ Protection XSS
- ✅ Helmet.js pour les headers de sécurité

## 📝 Scripts Disponibles

### Client
- `npm run dev` - Démarre le serveur de développement
- `npm run build` - Build de production
- `npm run lint` - Linting du code
- `npm run format` - Formatage avec Prettier

### Server
- `npm run dev` - Démarre le serveur en mode watch
- `npm run build` - Compile TypeScript
- `npm start` - Démarre le serveur compilé
- `npm run prisma:generate` - Génère le client Prisma
- `npm run prisma:migrate` - Exécute les migrations
- `npm run prisma:studio` - Ouvre Prisma Studio

## 🌐 Déploiement

### Frontend (Vercel)
```bash
cd client
vercel deploy
```

### Backend (Railway/Heroku)
```bash
cd server
# Suivre les instructions de votre plateforme
```

## 📚 Documentation API

Documentation complète disponible sur `/api/docs` une fois le serveur démarré.

Endpoints principaux:
- `POST /api/auth/login` - Connexion
- `GET /api/monteurs` - Liste des monteurs
- `GET /api/chantiers` - Liste des chantiers
- `POST /api/feuilles` - Créer une feuille
- `GET /api/feuilles` - Liste des feuilles

## 🐛 Debugging

**Vérifier la connexion à la base de données:**
```bash
cd server
npm run prisma:studio
```

**Vérifier les logs du serveur:**
Les logs sont affichés dans la console en mode développement.

## 📄 Licence

MIT

## 👨‍💻 Auteur

Maintenance Team

---

**Status du projet:** ✅ Phase 1 complétée - Infrastructure mise en place
