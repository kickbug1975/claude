# 📋 Liste des Actions Restantes - Application Maintenance

> **Date d'analyse** : 13 janvier 2026
> **Branche du projet** : `claude/maintenance-worksheet-app-013WDZ3e4z7shd3kPWaweMPY`
> **État** : Application fonctionnelle - Nécessite tests et améliorations

---

## 📊 Résumé Exécutif

L'application est **fonctionnellement complète** avec toutes les fonctionnalités principales implémentées :
- 30+ endpoints API opérationnels
- Interface utilisateur complète (React + TypeScript)
- 3,459 lignes de code
- 79 tests unitaires backend

**Points critiques à adresser** :
- Couverture de tests insuffisante (17% backend, 0% frontend)
- 25+ console.error à nettoyer
- Plusieurs failles de sécurité à corriger
- Fonctionnalités manquantes (upload UI, recherche, etc.)

---

## 🔴 PRIORITÉ CRITIQUE

### 1. Tests Backend (Couverture actuelle : 17%)

**Fichiers de tests manquants** :

- [ ] `server/src/__tests__/controllers/monteurController.test.ts`
  - Tester CRUD complet (Create, Read, Update, Delete)
  - Tester validation des données
  - Tester gestion des erreurs

- [ ] `server/src/__tests__/controllers/chantierController.test.ts`
  - Tester CRUD complet
  - Tester validation référence unique
  - Tester filtres et pagination

- [ ] `server/src/__tests__/controllers/feuilleController.test.ts`
  - Tester création de feuille
  - Tester workflow : BROUILLON → SOUMIS → VALIDE/REJETE
  - Tester calcul heures totales
  - Tester validation par superviseur

- [ ] `server/src/__tests__/controllers/fichierController.test.ts`
  - Tester upload de fichiers
  - Tester téléchargement
  - Tester suppression
  - Tester gestion S3/local

- [ ] `server/src/__tests__/controllers/cronController.test.ts`
  - Tester déclenchement manuel des tâches
  - Tester statut des jobs

- [ ] `server/src/__tests__/services/s3Service.test.ts`
  - Tester upload S3
  - Tester download S3
  - Tester delete S3
  - Tester fallback local

- [ ] `server/src/__tests__/services/cronService.test.ts`
  - Tester enregistrement des jobs
  - Tester exécution des tâches planifiées

**Objectif** : Passer de 79 à 150+ tests unitaires

---

### 2. Tests Frontend (Couverture actuelle : 0%)

**Pages à tester** :

- [ ] `client/src/__tests__/pages/Dashboard.test.tsx`
  - Vue Admin : stats globales, graphiques
  - Vue Superviseur : feuilles en attente
  - Vue Monteur : feuilles personnelles

- [ ] `client/src/__tests__/pages/Monteurs.test.tsx`
  - Liste avec pagination
  - Création nouveau monteur
  - Édition monteur
  - Suppression monteur

- [ ] `client/src/__tests__/pages/Chantiers.test.tsx`
  - Liste avec pagination
  - Création nouveau chantier
  - Édition chantier
  - Suppression chantier

- [ ] `client/src/__tests__/pages/Feuilles.test.tsx`
  - Liste avec filtres (statut, monteur)
  - Création feuille avec frais
  - Soumission pour validation
  - Validation/rejet (superviseur)

- [ ] `client/src/__tests__/pages/Login.test.tsx`
  - Formulaire de connexion
  - Validation
  - Redirection après login

**Composants à tester** :

- [ ] `client/src/__tests__/components/MonteurForm.test.tsx`
- [ ] `client/src/__tests__/components/ChantierForm.test.tsx`
- [ ] `client/src/__tests__/components/FeuilleForm.test.tsx`
- [ ] `client/src/__tests__/components/Pagination.test.tsx`
- [ ] `client/src/__tests__/components/ProtectedRoute.test.tsx`
- [ ] `client/src/__tests__/components/Toast.test.tsx`

**Services à tester** :

- [ ] `client/src/__tests__/services/monteurService.test.ts`
- [ ] `client/src/__tests__/services/chantierService.test.ts`
- [ ] `client/src/__tests__/services/feuilleService.test.ts`

**Objectif** : Créer 100+ tests frontend

---

### 3. Nettoyage du Code (25+ occurrences)

**Remplacer tous les `console.error()` par des notifications Toast** :

| Fichier | Lignes | Actions |
|---------|--------|---------|
| `client/src/App.tsx` | 21 | Remplacer par gestion d'erreur silencieuse |
| `client/src/services/api.ts` | 31, 53, 125 | Utiliser Toast pour erreurs réseau |
| `client/src/store/authStore.ts` | 67, 103 | Toast pour erreurs auth |
| `client/src/pages/Dashboard.tsx` | 84, 193, 206, 215, 325 | Toast pour erreurs chargement |
| `client/src/pages/Feuilles.tsx` | 77, 135, 347, 362, 377, 391 | Toast pour erreurs CRUD |
| `client/src/pages/Monteurs.tsx` | 52, 112 | Toast pour erreurs CRUD |
| `client/src/pages/Chantiers.tsx` | 52, 112 | Toast pour erreurs CRUD |
| `client/src/components/ChantierDetail.tsx` | 78 | Toast pour erreur chargement |
| `client/src/components/MonteurDetail.tsx` | 65 | Toast pour erreur chargement |
| `client/src/components/FeuilleForm.tsx` | 95 | Toast pour erreur validation |

**Actions** :
- Créer une fonction utilitaire `handleError(error, message)`
- Remplacer tous les console.error par cette fonction
- S'assurer que les erreurs sont visibles pour l'utilisateur

---

### 4. Sécurité

#### **Contrôle d'Accès aux Fichiers**
```typescript
// server/src/controllers/fichierController.ts
// TODO: Ajouter vérification permissions avant download
// Vérifier que l'utilisateur a le droit d'accéder au fichier
```

**Actions** :
- [ ] Vérifier que le fichier appartient à une feuille de l'utilisateur
- [ ] Admin/Superviseur peuvent accéder à tous les fichiers
- [ ] Monteur ne peut accéder qu'à ses propres fichiers

#### **Validation Force des Mots de Passe**
```typescript
// server/src/controllers/authController.ts
// TODO: Ajouter validation force mot de passe
```

**Critères minimum** :
- [ ] Minimum 8 caractères
- [ ] Au moins 1 majuscule
- [ ] Au moins 1 minuscule
- [ ] Au moins 1 chiffre
- [ ] Au moins 1 caractère spécial

#### **Audit Trail**
- [ ] Créer table `audit_logs` pour tracer les modifications
- [ ] Logger : qui, quoi, quand, valeur avant/après
- [ ] Particulièrement pour : validation feuilles, modifications monteurs/chantiers

#### **Protection CSRF**
- [ ] Vérifier que la protection CSRF est active sur TOUS les endpoints de mutation
- [ ] Tester le middleware CSRF

---

## 🟠 PRIORITÉ ÉLEVÉE

### 5. Fonctionnalités Manquantes

#### **Interface Upload de Fichiers**
- [ ] Ajouter composant `FileUpload.tsx`
- [ ] Intégrer dans `FeuilleForm.tsx`
- [ ] Indicateur de progression
- [ ] Prévisualisation des fichiers
- [ ] Validation taille/type fichier côté client

#### **Recherche Full-Text**
```sql
-- Ajouter indexes full-text sur PostgreSQL
CREATE INDEX idx_monteurs_search ON monteurs USING gin(to_tsvector('french', nom || ' ' || prenom || ' ' || email));
CREATE INDEX idx_chantiers_search ON chantiers USING gin(to_tsvector('french', nom || ' ' || client || ' ' || reference));
```

**Frontend** :
- [ ] Barre de recherche sur pages Monteurs
- [ ] Barre de recherche sur pages Chantiers
- [ ] Barre de recherche sur pages Feuilles
- [ ] Recherche temps réel (debounce 300ms)

#### **Export CSV**
- [ ] Endpoint `GET /api/monteurs/export`
- [ ] Endpoint `GET /api/chantiers/export`
- [ ] Endpoint `GET /api/feuilles/export`
- [ ] Bouton "Exporter CSV" sur chaque page liste
- [ ] Inclure filtres actifs dans l'export

#### **Filtres Avancés**
- [ ] Filtrer feuilles par date (plage)
- [ ] Filtrer feuilles par monteur
- [ ] Filtrer feuilles par chantier
- [ ] Filtrer par montant frais
- [ ] Sauvegarder les filtres préférés (localStorage)

#### **Opérations en Masse**
- [ ] Checkbox sur chaque ligne de tableau
- [ ] "Sélectionner tout"
- [ ] Actions groupées : supprimer, exporter, changer statut
- [ ] Confirmation avant action massive

---

### 6. Validation des Formulaires

#### **Validation Temps Réel**
- [ ] Valider pendant la saisie (onBlur)
- [ ] Afficher erreurs en temps réel
- [ ] Désactiver bouton submit si erreurs

#### **Validation Croisée**
```typescript
// Exemples de validations à ajouter :
- dateFin >= dateDebut (chantiers)
- heureFin > heureDebut (feuilles)
- email unique (monteurs)
- reference unique (chantiers)
- numeroIdentification unique (monteurs)
```

#### **Upload de Fichiers**
- [ ] Barre de progression
- [ ] Aperçu avant upload (images)
- [ ] Validation taille max (5MB)
- [ ] Types MIME autorisés : PDF, JPG, PNG

---

### 7. Tests d'Intégration & E2E

#### **Tests d'Intégration**
- [ ] Installer `supertest` pour tests API
- [ ] Tester flux complets :
  - Création monteur → Création compte user
  - Création feuille → Ajout frais → Soumission → Validation
  - Upload fichier → Association feuille → Download

**Fichiers à créer** :
```
server/src/__tests__/integration/
  ├── auth.integration.test.ts
  ├── monteur.integration.test.ts
  ├── chantier.integration.test.ts
  ├── feuille.integration.test.ts
  └── fichier.integration.test.ts
```

#### **Tests E2E**
- [ ] Installer Playwright ou Cypress
- [ ] Tester flux utilisateur complet :
  - Admin crée monteur
  - Monteur se connecte
  - Monteur crée feuille
  - Monteur soumet feuille
  - Superviseur valide feuille

**Objectif** : 60% couverture intégration

---

## 🟡 PRIORITÉ MOYENNE

### 8. Optimisation des Performances

#### **Backend**
- [ ] Ajouter indexes composites pour filtres communs :
```sql
CREATE INDEX idx_feuilles_monteur_statut ON feuilles_travail(monteurId, statut);
CREATE INDEX idx_feuilles_chantier_date ON feuilles_travail(chantierId, dateTravail);
```
- [ ] Analyser requêtes N+1 avec Prisma
- [ ] Implémenter caching Redis pour données fréquentes
- [ ] Pagination configurable (param `limit`)

#### **Frontend**
- [ ] Lazy load des pages : `React.lazy(() => import('./pages/Dashboard'))`
- [ ] Mémoïsation composants lourds : `React.memo()`
- [ ] Optimisation images (compression, formats modernes)
- [ ] Bundle analysis : `npm run build -- --report`
- [ ] Code splitting par route

#### **Base de Données**
- [ ] Analyser performances requêtes : `EXPLAIN ANALYZE`
- [ ] Ajouter limites par défaut sur toutes les requêtes
- [ ] Vacuum régulier de la DB

---

### 9. Logique Métier à Corriger

#### **Workflow Feuilles**
```typescript
// Valider transitions d'état
BROUILLON → SOUMIS ✅
SOUMIS → VALIDE ✅
SOUMIS → REJETE ✅
REJETE → BROUILLON ✅
VALIDE → REJETE ❌ (ne devrait pas être possible)
REJETE → VALIDE ❌ (doit repasser par SOUMIS)
```

**Actions** :
- [ ] Ajouter validation des transitions dans `feuilleController.ts`
- [ ] Retourner erreur 400 si transition invalide
- [ ] Documenter le workflow dans README

#### **Cascade Deletion**
- [ ] Empêcher suppression monteur avec feuilles actives
- [ ] Empêcher suppression chantier avec feuilles actives
- [ ] Option : archiver au lieu de supprimer

#### **Chantiers Fermés**
- [ ] Valider que chantier est actif avant création feuille
- [ ] Afficher warning si chantier proche de dateFin
- [ ] Filtrer chantiers inactifs dans sélecteurs

#### **Frais**
- [ ] Empêcher modification/ajout frais après validation feuille
- [ ] Validation côté backend (pas seulement frontend)

---

### 10. Infrastructure & Configuration

#### **Docker**
- [ ] Créer `docker-compose.yml` pour dev :
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: maintenance_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
  redis:
    image: redis:7
    ports:
      - "6379:6379"
```

#### **Scripts de Setup**
- [ ] `npm run setup` : install + migrate + seed
- [ ] `npm run reset` : drop DB + recreate + seed
- [ ] `npm run test:all` : backend + frontend + e2e

#### **Configuration Email de Test**
- [ ] Intégrer Mailhog pour dev
- [ ] Docker service mailhog
- [ ] Configuration automatique si NODE_ENV=development

#### **Logging**
- [ ] Persister logs Winston dans fichiers rotatifs
- [ ] Logs séparés par niveau (error.log, combined.log)
- [ ] Intégration Sentry pour production

#### **Backups**
- [ ] Script backup PostgreSQL : `scripts/backup.sh`
- [ ] Cron quotidien de backup
- [ ] Documentation de restauration

---

## 🟢 PRIORITÉ BASSE

### 11. Documentation

#### **API**
- [ ] Compléter commentaires Swagger sur tous les endpoints
- [ ] Documenter codes erreur possibles
- [ ] Exemples de requêtes/réponses
- [ ] Générer documentation HTML : `npm run docs`

#### **Architecture**
- [ ] Diagramme d'architecture système (draw.io)
- [ ] Diagramme entité-relation (ERD) de la base
- [ ] Diagrammes de séquence pour flux complexes :
  - Authentification JWT
  - Création et validation feuille
  - Upload et stockage fichiers

#### **Guides**
- [ ] `TESTING.md` : Comment écrire et lancer les tests
- [ ] `CONTRIBUTING.md` : Guide pour contributeurs
- [ ] `DEPLOYMENT.md` : Guide de déploiement production
- [ ] `TROUBLESHOOTING.md` : Problèmes courants et solutions

#### **Code**
- [ ] JSDoc sur fonctions complexes (`calculateHours`, `validateFeuille`)
- [ ] Expliquer constantes magiques
- [ ] Documenter types complexes

---

### 12. UX/Améliorations

#### **États de Chargement**
- [ ] Skeleton loaders pour tableaux
- [ ] Spinners sur boutons async
- [ ] Texte "Chargement..." sur pages

#### **Mode Hors Ligne**
- [ ] Service Worker pour cache
- [ ] Détection connexion perdue
- [ ] Queue requêtes échouées
- [ ] Synchronisation à la reconnexion

#### **Auto-Save**
- [ ] Sauvegarder brouillons feuilles automatiquement (30s)
- [ ] Indicateur "Sauvegarde auto..."
- [ ] Restaurer brouillon au retour

#### **Raccourcis Clavier**
- [ ] Ctrl+S : Sauvegarder formulaire
- [ ] Ctrl+N : Nouveau (monteur/chantier/feuille)
- [ ] Esc : Fermer modal
- [ ] ? : Afficher aide raccourcis

#### **Accessibilité**
- [ ] Labels ARIA sur tous les boutons/inputs
- [ ] Navigation clavier complète
- [ ] Contraste couleurs WCAG AA
- [ ] Textes alternatifs images
- [ ] Taille police ajustable

#### **Features Nice-to-Have**
- [ ] Mode sombre
- [ ] Multi-langue (i18n)
- [ ] Notifications push (PWA)
- [ ] Export PDF personnalisable
- [ ] Graphiques dashboard interactifs

---

## 📈 Métriques Cibles

| Métrique | Actuel | Cible |
|----------|--------|-------|
| **Tests unitaires backend** | 79 | 150+ |
| **Tests unitaires frontend** | 28 | 100+ |
| **Couverture code backend** | ~17% | 80%+ |
| **Couverture code frontend** | ~10% | 70%+ |
| **Tests intégration** | 0 | 30+ |
| **Tests E2E** | 0 | 10+ |
| **Console.error** | 25+ | 0 |
| **Failles sécurité** | 8 | 0 |
| **Performance Lighthouse** | ? | 90+ |
| **Accessibilité** | ? | 90+ |

---

## 🎯 Roadmap Suggérée

### **Sprint 1 : Tests & Qualité (2 semaines)**
1. Installer et configurer Jest correctement
2. Écrire tests controllers manquants (5 fichiers)
3. Écrire tests pages principales (5 fichiers)
4. Nettoyer console.error (25+ occurrences)
5. Ajouter tests intégration basiques

### **Sprint 2 : Sécurité (1 semaine)**
1. Contrôle accès fichiers
2. Validation force mots de passe
3. Audit trail
4. Vérifier CSRF sur tous endpoints

### **Sprint 3 : Fonctionnalités (2 semaines)**
1. Interface upload fichiers
2. Recherche full-text
3. Export CSV
4. Filtres avancés
5. Opérations en masse

### **Sprint 4 : Performance & UX (1 semaine)**
1. Lazy loading
2. Mémoïsation composants
3. États de chargement
4. Optimisation bundles
5. Indexes DB

### **Sprint 5 : Documentation & Déploiement (1 semaine)**
1. Documentation API complète
2. Guides (TESTING, CONTRIBUTING, DEPLOYMENT)
3. Docker-compose pour prod
4. CI/CD pipeline
5. Tests E2E

---

## 🔧 Actions Immédiates (Top 10)

| # | Action | Fichier | Priorité |
|---|--------|---------|----------|
| 1 | Installer Jest | `server/`, `client/` | 🔴 Critique |
| 2 | Tests `monteurController` | `server/src/__tests__/controllers/` | 🔴 Critique |
| 3 | Tests `feuilleController` | `server/src/__tests__/controllers/` | 🔴 Critique |
| 4 | Tests `Dashboard` | `client/src/__tests__/pages/` | 🔴 Critique |
| 5 | Nettoyer `api.ts` | `client/src/services/api.ts` | 🔴 Critique |
| 6 | Contrôle accès fichiers | `server/src/controllers/fichierController.ts` | 🔴 Critique |
| 7 | Validation mots de passe | `server/src/controllers/authController.ts` | 🔴 Critique |
| 8 | Setup E2E tests | `e2e/` (nouveau dossier) | 🟠 Élevée |
| 9 | Documentation tests | `TESTING.md` | 🟠 Élevée |
| 10 | CI/CD GitHub Actions | `.github/workflows/` | 🟠 Élevée |

---

## 💡 Notes Finales

### **Ce qui fonctionne bien** ✅
- Architecture propre et bien organisée
- Séparation backend/frontend claire
- Utilisation de TypeScript partout
- Rate limiting et CSRF configurés
- Winston logging en place
- 79 tests existants (bonne base)

### **Points d'attention** ⚠️
- Tests insuffisants pour production
- Sécurité à renforcer (accès fichiers, audit)
- Performance non optimisée
- Documentation incomplète
- Plusieurs console.error non gérés

### **Recommandation**
L'application est **fonctionnelle en l'état** pour de la démonstration ou du développement, mais **nécessite impérativement** les corrections de sécurité et l'ajout de tests avant toute mise en production.

**Prioriser** : Tests > Sécurité > Fonctionnalités > Performance > Documentation

---

**Document créé le** : 13 janvier 2026
**Dernière mise à jour** : 13 janvier 2026
**Auteur** : Claude (Analyse automatisée du code)
