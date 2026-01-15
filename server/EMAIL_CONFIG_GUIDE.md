# Guide de Configuration Email 📧

Ce projet utilise `nodemailer` pour l'envoi d'emails (notifications de soumission, validation, rappels cron).

## 1. Mode Développement & Test (Fallback)
Par défaut, si aucune configuration Gmail n'est détectée ou si elle échoue, le système bascule automatiquement sur **Ethereal Email**.
- **Avantage** : Aucune configuration requise.
- **Visualisation** : Les liens de prévisualisation des emails envoyés s'affichent dans les logs de la console.
- **Utilisation** : Idéal pour tester les flux sans envoyer de vrais emails.

## 2. Configuration Gmail (Production / Réel)
Pour envoyer des emails via un compte Gmail, suivez ces étapes :

### Étape A : Activer la Validation en deux étapes
1. Connectez-vous à votre [Compte Google](https://myaccount.google.com/).
2. Allez dans **Sécurité**.
3. Assurez-vous que la **Validation en deux étapes** est activée.

### Étape B : Créer un Mot de passe d'application
1. Dans la barre de recherche de votre compte Google, tapez "Mots de passe d'application".
2. Donnez un nom (ex: "Application Maintenance").
3. Copiez le code de 16 caractères généré.

### Étape C : Configurer le fichier `.env`
Mettez à jour les variables suivantes :
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre.email@gmail.com
SMTP_PASSWORD=le_code_de_16_caracteres_sans_espaces
SMTP_FROM=votre.email@gmail.com
```

## ⚠️ Notes Importantes
- **Gmail 535 Error** : Si vous recevez cette erreur, c'est que le mot de passe est rejeté. Utilisez IMPÉRATIVEMENT un mot de passe d'application, pas votre mot de passe habituel.
- **Port** : Utilisez le port `587` (TLS).
