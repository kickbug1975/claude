# 📱 Plan d'Implémentation Mobile (Responsive & PWA)

**Objectif** : Rendre l'application accessible et optimisée pour les smartphones/tablettes, transformant le site web en une véritable application installable (PWA) pour les monteurs sur chantier.

---

## 🏗️ 1. Architecture PWA (Progressive Web App)

Transformer le site en application installable sur l'écran d'accueil sans passer par l'App Store / Play Store.

### 📦 Installation
- **Outil** : `vite-plugin-pwa`
- **Fonctionnalités** :
  - **Manifest** : Nom de l'app, icônes, couleur de thème, écran de démarrage.
  - **Service Worker** : Mise en cache des fichiers statiques (JS, CSS, Images) pour chargement instantané.
  - **Installation** : Bouton "Installer l'application" dans le menu.

### 📝 Configuration
```json
// Exemple de manifest.json
{
  "name": "Maintenance App",
  "short_name": "Maintenance",
  "theme_color": "#2563eb",
  "background_color": "#ffffff",
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "icons": [
    { "src": "/pwa-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/pwa-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 🎨 2. Optimisation UI/UX Mobile ("Full Responsive")

Adapter l'interface pour les écrans tactiles et petits formats.

### 📱 Navigation & Layout (Déjà bien avancé)
- **Menu** : Le menu "Hamburger" est déjà implémenté (vérifié dans `Layout.tsx`).
- **Sidebar** : Glisse depuis la gauche sur mobile (OK).
- **Header** : Fixe en haut de l'écran pour accès rapide (OK).

### 📋 Listes et Tableaux (Point Critique)
Les grands tableaux (Feuilles de travail, Monteurs) sont illisibles sur mobile.
- **Solution** : Passer automatiquement d'une vue "Tableau" (Desktop) à une vue "Cartes" (Mobile).
- **Mise en œuvre** :
  - Utiliser les classes `hidden md:table` pour le tableau.
  - Créer un composant `<CardView />` visible uniquement sur mobile (`md:hidden`).

**Exemple Visuel :**
*Desktop* : Une ligne de tableau avec 6 colonnes.
*Mobile* : Une carte rectangulaire avec :
  - En haut : Date et Statut (Badge)
  - Milieu : Nom du chantier (Gros) + Monteur
  - Bas : Boutons d'action larges (Voir, Modifier)

### 🖱️ Ergonomie Tactile
- **Boutons** : Hauteur minimale de 44px (standard tactile).
- **Champs** : Police `16px` minimum pour éviter le zoom automatique sur iPhone.
- **Modales** : Plein écran sur mobile pour maximiser l'espace, avec bouton "Fermer" (X) bien visible en haut à droite.

---

## 🚀 3. Fonctionnalités "Chantier" (Offline & Upload)

### 📸 Upload Photo Amélioré
- **Input** : Utiliser `capture="environment"` pour ouvrir directement la caméra arrière.
- **Compression** : Réduire la taille des images avant l'envoi pour économiser la data mobile (via `browser-image-compression`).

### 📡 Mode Dégradé
- Avertir l'utilisateur en cas de perte de connexion ("Vous êtes hors ligne").
- Désactiver les boutons de soumission si pas de réseau (pour éviter les erreurs frustrantes).

---

## 1. Setup PWA (Prioritaire)
- [x] Installer `vite-plugin-pwa`
- [x] Configurer `vite.config.ts` (Manifest, Icons, Cache strategy)
- [x] Générer les icones (192, 512, apple-icon) dans `public/`
- [x] Vérifier le registerSW dans `index.html` ou entry point

## 2. Refonte Listes Mobile
L'objectif est de passer d'un `<table>` desktop à une vue "Liste de Cartes" sur mobile.

- [x] **Feuilles de Travail (`Feuilles.tsx`)**
    - Créer composant `FeuilleCardMobile` (ou intégrer dans le fichier)
    - CSS: `hidden md:block` pour le tableau, `md:hidden` pour les cartes
    - Design Carte: Date en gros, Statut badge, Bouton "Détails" large

- [x] **Monteurs & Chantiers**
    - Vérifier que les grilles existantes passent bien en 1 colonne (déjà le cas souvent avec Tailwind `grid-cols-1`)
    - Ajuster la taille des boutons d'action.

## 3. Optimisation Modales & Forms
- [x] **Modales (`Modal.tsx`)**
    - Sur mobile (`sm:`): Full screen `w-full h-full fixed inset-0`
    - Bouton "Fermer" bien visible en haut.
- [x] **Inputs**
    - Vérifier taille police > 16px pour éviter le zoom auto sur iOS.
    - Padding suffisant sur les boutons (min 44px height).

## 4. Test Opérationnel
- [x] Build de production `npm run build`
- [x] Preview locale `npm run preview`
- [x] Test sur un vrai mobile (si possible via IP locale)
- [x] Check installation PWA ("Ajouter à l'écran d'accueil").

---
**Voulez-vous que je commence par l'étape 1 (Setup PWA) ou que je m'attaque d'abord à l'interface (Refonte Listes Mobile) ?**
