# ✅ Plan de Test : Système d'Authentification et Setup Wizard

**Date**: 2026-01-16  
**Version**: 1.0  
**Modifications appliquées**: Option A (Blocage `/login` pendant le setup)

---

## 🎯 Objectif des Tests

Vérifier que le système d'authentification fonctionne correctement dans tous les scénarios :
1. **Première installation** (pas d'admin)
2. **Setup en cours** (admin existe, setup incomplet)
3. **Application configurée** (setup complet)

---

## 📋 Scénarios de Test

### **Test 1 : Première Installation (Pas d'Admin)**

**État initial** :
- ✅ Base de données vide (pas d'utilisateur admin)
- ✅ `isSetupComplete = false`

**Actions** :
1. Accéder à `http://localhost:3002/`
2. Accéder à `http://localhost:3002/login`

**Résultats attendus** :
- ✅ `/` → Affiche le **Wizard** (étape 1 : création admin)
- ✅ `/login` → **Redirige vers `/`** (Wizard)
- ✅ Le Wizard affiche "Initialisation Globale"
- ✅ Possibilité de créer le premier compte admin

**Résultats réels** :
- [ ] À tester

---

### **Test 2 : Création du Compte Admin**

**Actions** :
1. Dans le Wizard (étape 1), entrer :
   - Email : `admin@test.com`
   - Mot de passe : `Admin123!`
2. Cliquer sur "Créer mon compte et continuer"

**Résultats attendus** :
- ✅ Compte admin créé avec succès
- ✅ Connexion automatique
- ✅ Passage à l'étape 2 du Wizard (Identité de l'entreprise)
- ✅ Toast de confirmation : "Initialisation réussie"

**Résultats réels** :
- [ ] À tester

---

### **Test 3 : Tentative de Connexion Non-Admin Pendant le Setup**

**État initial** :
- ✅ Admin créé
- ✅ Setup incomplet (`isSetupComplete = false`)
- ✅ Utilisateur non-admin créé manuellement (ex: Superviseur)

**Actions** :
1. Se déconnecter du compte admin
2. Accéder à `http://localhost:3002/login`
3. Tenter de se connecter avec un compte non-admin

**Résultats attendus** :
- ✅ `/login` → **Redirige vers `/`** (Wizard)
- ✅ Le Wizard affiche "Accès Administrateur"
- ✅ Si connexion avec compte non-admin : Message d'erreur "Seul un administrateur peut configurer l'application"
- ✅ Déconnexion automatique

**Résultats réels** :
- [ ] À tester

---

### **Test 4 : Finalisation du Setup**

**Actions** :
1. Se connecter avec le compte admin
2. Compléter toutes les étapes du Wizard :
   - Étape 2 : Identité de l'entreprise
   - Étape 3 : Branding (logos)
   - Étape 4 : Import de données (optionnel)
   - Étape 5 : Finaliser
3. Cliquer sur "FINALISER LA CONFIGURATION"

**Résultats attendus** :
- ✅ `isSetupComplete` passe à `true`
- ✅ Redirection vers `/dashboard`
- ✅ Toast de confirmation : "Configuration terminée avec succès !"

**Résultats réels** :
- [ ] À tester

---

### **Test 5 : Connexion Normale Après Setup**

**État initial** :
- ✅ Setup complet (`isSetupComplete = true`)
- ✅ Utilisateurs créés (Admin, Superviseur, Monteur)

**Actions** :
1. Se déconnecter
2. Accéder à `http://localhost:3002/login`
3. Se connecter avec différents comptes :
   - Admin
   - Superviseur
   - Monteur

**Résultats attendus** :
- ✅ `/login` → Affiche la **page de connexion classique**
- ✅ Connexion réussie pour tous les rôles
- ✅ Redirection vers `/dashboard` après connexion
- ✅ Pas d'accès au Wizard

**Résultats réels** :
- [ ] À tester

---

### **Test 6 : Tentative d'Accès au Wizard Après Setup**

**Actions** :
1. Setup complet
2. Connecté en tant qu'admin
3. Accéder à `http://localhost:3002/wizard` (route supprimée)

**Résultats attendus** :
- ✅ Route `/wizard` n'existe plus
- ✅ Redirection vers `/dashboard` (catch-all)

**Résultats réels** :
- [ ] À tester

---

### **Test 7 : Accès Direct à `/` Après Setup**

**Actions** :
1. Setup complet
2. Non authentifié
3. Accéder à `http://localhost:3002/`

**Résultats attendus** :
- ✅ Redirection vers `/login` (ProtectedRoute)

**Résultats réels** :
- [ ] À tester

---

## 🔍 Points de Vérification Supplémentaires

### **Sécurité** :
- [ ] Seul un ADMIN peut finaliser le setup
- [ ] Les utilisateurs non-admin ne peuvent pas accéder au Wizard
- [ ] Les tokens JWT sont correctement générés
- [ ] Les refresh tokens fonctionnent

### **UX** :
- [ ] Les messages d'erreur sont clairs
- [ ] Les redirections sont fluides (pas de boucles)
- [ ] Les toasts de confirmation s'affichent correctement

### **Persistance** :
- [ ] `isSetupComplete` est correctement sauvegardé en base de données
- [ ] Le rechargement de la page ne réinitialise pas le setup

---

## 📊 Résumé des Modifications

### **Fichiers modifiés** :

1. **`client/src/App.tsx`** :
   - ✅ Ajout de la redirection `/login` → `/` si `isSetupComplete = false`
   - ✅ Suppression de la route `/wizard` standalone
   - ✅ Suppression de la variable `user` non utilisée

2. **`client/src/pages/Wizard.tsx`** :
   - ✅ Ajout de la vérification du rôle ADMIN après connexion
   - ✅ Déconnexion automatique si l'utilisateur n'est pas ADMIN

---

## 🎯 Checklist de Validation

Avant de considérer les modifications comme validées :

- [ ] Tous les tests ci-dessus sont passés avec succès
- [ ] Aucune régression détectée
- [ ] Les logs du serveur ne montrent pas d'erreurs
- [ ] L'expérience utilisateur est fluide
- [ ] La documentation est à jour

---

## 📝 Notes de Test

*Espace réservé pour les notes pendant les tests :*

```
Date : ___________
Testeur : ___________

Test 1 : ☐ Réussi ☐ Échoué
Notes : 

Test 2 : ☐ Réussi ☐ Échoué
Notes : 

Test 3 : ☐ Réussi ☐ Échoué
Notes : 

Test 4 : ☐ Réussi ☐ Échoué
Notes : 

Test 5 : ☐ Réussi ☐ Échoué
Notes : 

Test 6 : ☐ Réussi ☐ Échoué
Notes : 

Test 7 : ☐ Réussi ☐ Échoué
Notes : 
```

---

**Prêt pour les tests !** 🚀
