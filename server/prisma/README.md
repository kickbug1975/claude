# 📊 Schéma de Base de Données - Maintenance App

## 📐 Vue d'Ensemble

Cette base de données PostgreSQL gère un système complet de suivi des feuilles de travail pour une équipe de maintenance.

## 🗂️ Modèles de Données

### 1. User (Utilisateurs)

Gère l'authentification et les autorisations des utilisateurs.

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // Hashé avec bcrypt
  role      Role     @default(MONTEUR)
  monteurId String?  @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Rôles disponibles:**
- `ADMIN` - Accès complet (gestion utilisateurs, monteurs, chantiers)
- `SUPERVISEUR` - Validation des feuilles, visualisation globale
- `MONTEUR` - Création et consultation de ses propres feuilles

**Relations:**
- `monteurId` → Lien vers un profil Monteur (optionnel)
- Peut valider des feuilles de travail (en tant que superviseur)

---

### 2. Monteur

Profil détaillé des monteurs/techniciens.

```prisma
model Monteur {
  id                   String   @id @default(uuid())
  nom                  String
  prenom               String
  telephone            String
  email                String   @unique
  adresse              String
  dateEmbauche         DateTime
  numeroIdentification String   @unique
  actif                Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

**Champs clés:**
- `numeroIdentification` - Identifiant unique (ex: MON-001)
- `actif` - Permet de désactiver un monteur sans le supprimer
- `email` - Doit correspondre à l'email du User associé

**Relations:**
- Lié à un User (relation 1-1 optionnelle)
- Possède plusieurs FeuilleTravail (1-*)

---

### 3. Chantier

Informations sur les sites de travail.

```prisma
model Chantier {
  id          String    @id @default(uuid())
  nom         String
  adresse     String
  client      String
  reference   String    @unique
  dateDebut   DateTime
  dateFin     DateTime?
  description String    @db.Text
  actif       Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

**Champs clés:**
- `reference` - Code unique du chantier (ex: CHANT-2024-001)
- `dateFin` - Optionnel, null si le chantier est toujours actif
- `actif` - Permet de fermer un chantier

**Relations:**
- Possède plusieurs FeuilleTravail (1-*)

---

### 4. FeuilleTravail (Feuilles de Travail)

Enregistrement détaillé d'une journée de travail.

```prisma
model FeuilleTravail {
  id                 String        @id @default(uuid())
  monteurId          String
  chantierId         String
  dateTravail        DateTime
  dateSaisie         DateTime      @default(now())
  heureDebut         String        // Format HH:mm
  heureFin           String        // Format HH:mm
  heuresTotales      Float         // Calculé automatiquement
  descriptionTravail String        @db.Text
  statut             StatutFeuille @default(BROUILLON)
  valideParId        String?
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
}
```

**Statuts disponibles:**
- `BROUILLON` - Feuille en cours de rédaction
- `SOUMIS` - Feuille soumise, en attente de validation
- `VALIDE` - Feuille approuvée par un superviseur
- `REJETE` - Feuille rejetée, nécessite corrections

**Champs calculés:**
- `heuresTotales` - Différence entre heureFin et heureDebut

**Relations:**
- Appartient à un Monteur (monteurId)
- Appartient à un Chantier (chantierId)
- Peut être validée par un User (valideParId)
- Possède plusieurs Frais (1-*)

**Index:**
- `monteurId` - Recherche rapide par monteur
- `chantierId` - Recherche rapide par chantier
- `dateTravail` - Tri chronologique
- `statut` - Filtrage par statut

---

### 5. Frais

Frais engagés lors d'une journée de travail.

```prisma
model Frais {
  id            String     @id @default(uuid())
  feuilleId     String
  typeFrais     TypeFrais
  montant       Float
  description   String
  fichierProuve String?    // URL du fichier sur S3
  createdAt     DateTime   @default(now())
}
```

**Types de frais:**
- `TRANSPORT` - Frais de déplacement
- `MATERIEL` - Achat de matériel/outils
- `REPAS` - Repas sur site
- `AUTRES` - Autres frais divers

**Champs clés:**
- `fichierProuve` - URL optionnelle vers une preuve (ticket, facture)
- `montant` - Montant en euros

**Relations:**
- Appartient à une FeuilleTravail (feuilleId)

---

## 🔗 Diagramme des Relations

```
┌─────────────┐
│    User     │
│  (id, role) │
└──────┬──────┘
       │ 1
       │
       │ 0..1
┌──────▼──────────┐         1         ┌────────────────┐
│    Monteur      │◄──────────────────┤ FeuilleTravail │
│ (id, nom, ...)  │                   │  (id, date...) │
└─────────────────┘         *         └───────┬────────┘
                                              │ 1
                                              │
┌─────────────────┐         1                │
│    Chantier     │◄─────────────────────────┘
│ (id, nom, ...)  │         *
└─────────────────┘

                            ┌────────────────┐
                            │ FeuilleTravail │
                            │  (id, ...)     │
                            └───────┬────────┘
                                    │ 1
                                    │
                                    │ *
                            ┌───────▼────────┐
                            │     Frais      │
                            │ (id, montant)  │
                            └────────────────┘

┌─────────────┐
│    User     │
│(superviseur)│◄──────────────────────┐
└─────────────┘                       │
                                      │ 0..1 (validateur)
                            ┌─────────┴────────┐
                            │ FeuilleTravail   │
                            │  (valideParId)   │
                            └──────────────────┘
```

## 📝 Règles de Gestion

### Cascade Deletes

- ❌ **User supprimé** → Monteur associé est déconnecté (SetNull)
- ✅ **Monteur supprimé** → Ses FeuilleTravail sont supprimées (Cascade)
- ✅ **Chantier supprimé** → Ses FeuilleTravail sont supprimées (Cascade)
- ✅ **FeuilleTravail supprimée** → Ses Frais sont supprimés (Cascade)
- ❌ **User validateur supprimé** → FeuilleTravail reste mais valideParId = null (SetNull)

### Contraintes d'Unicité

- `User.email` - Unique
- `Monteur.email` - Unique
- `Monteur.numeroIdentification` - Unique
- `Chantier.reference` - Unique
- `User.monteurId` - Unique (un monteur = un user)

### Valeurs par Défaut

- `User.role` → `MONTEUR`
- `FeuilleTravail.statut` → `BROUILLON`
- `FeuilleTravail.dateSaisie` → Date actuelle
- `Monteur.actif` → `true`
- `Chantier.actif` → `true`

## 🔍 Requêtes Courantes

### Récupérer toutes les feuilles d'un monteur avec détails

```typescript
const feuilles = await prisma.feuilleTravail.findMany({
  where: { monteurId: 'xxx' },
  include: {
    monteur: true,
    chantier: true,
    frais: true,
    validePar: {
      select: { email: true, role: true }
    }
  },
  orderBy: { dateTravail: 'desc' }
})
```

### Calculer le total des frais d'une feuille

```typescript
const totalFrais = await prisma.frais.aggregate({
  where: { feuilleId: 'xxx' },
  _sum: { montant: true }
})
```

### Feuilles en attente de validation

```typescript
const enAttente = await prisma.feuilleTravail.findMany({
  where: { statut: 'SOUMIS' },
  include: {
    monteur: { select: { nom: true, prenom: true } },
    chantier: { select: { nom: true } }
  }
})
```

### Statistiques d'un monteur pour un mois

```typescript
const stats = await prisma.feuilleTravail.aggregate({
  where: {
    monteurId: 'xxx',
    dateTravail: {
      gte: new Date('2024-03-01'),
      lte: new Date('2024-03-31')
    }
  },
  _sum: { heuresTotales: true },
  _count: true
})
```

## 🔐 Sécurité

### Mots de passe

- Toujours hashés avec `bcrypt` (10 rounds minimum)
- Jamais stockés en clair
- Jamais retournés dans les requêtes (utiliser `select`)

### Soft Delete

Les modèles `Monteur` et `Chantier` utilisent un flag `actif` pour le soft delete au lieu de supprimer réellement les enregistrements.

**Avantages:**
- Conservation de l'historique
- Possibilité de réactivation
- Intégrité référentielle préservée

## 📦 Migrations

Les migrations sont stockées dans `prisma/migrations/`.

### Créer une nouvelle migration

```bash
npm run prisma:migrate
```

### Appliquer les migrations (production)

```bash
npm run prisma:migrate:prod
```

## 🌱 Seed

Le fichier `seed.ts` crée des données de test :

- 4 utilisateurs (1 admin, 1 superviseur, 2 monteurs)
- 2 monteurs
- 3 chantiers
- 3 feuilles de travail
- 6 frais

```bash
npm run prisma:seed
```

## 🚀 Optimisations

### Index créés

- `FeuilleTravail.monteurId` - Améliore les requêtes par monteur
- `FeuilleTravail.chantierId` - Améliore les requêtes par chantier
- `FeuilleTravail.dateTravail` - Améliore le tri chronologique
- `FeuilleTravail.statut` - Améliore les filtres par statut
- `Frais.feuilleId` - Améliore les requêtes de frais

### Conseils de performance

1. **Utilisez `select`** pour limiter les champs retournés
2. **Utilisez `include` avec parcimonie** - évitez les jointures profondes
3. **Paginéez** les grandes listes (skip/take)
4. **Utilisez les agrégations** pour les calculs côté base de données
5. **Créez des index** pour les champs fréquemment filtrés

## 📚 Documentation

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
