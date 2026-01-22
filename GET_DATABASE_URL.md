# Guide: Récupération de l'URL de la Base de Données Render

## Étapes pour récupérer l'URL de connexion PostgreSQL

### Via le Dashboard Render (Recommandé)

1. **Ouvrez le Dashboard Render**
   - Allez sur https://dashboard.render.com
   - Connectez-vous avec vos identifiants

2. **Trouvez votre base de données PostgreSQL**
   - Dans la liste des services, cherchez une base de données PostgreSQL
   - Elle devrait apparaître avec une icône de base de données

3. **Accédez aux détails de la base de données**
   - Cliquez sur la base de données PostgreSQL
   - Vous serez redirigé vers la page de détails

4. **Copiez l'URL de connexion**
   - Cherchez la section "Connections" ou "Info"
   - Vous verrez deux URLs :
     - **Internal Database URL** : Pour les services Render (recommandé)
     - **External Database URL** : Pour les connexions externes
   - Copiez l'**Internal Database URL**

5. **Format de l'URL**
   ```
   postgresql://user:password@host:port/database
   ```

6. **Mettez à jour votre fichier .env**
   ```bash
   # Dans c:\Users\Dimitri\claude\server\.env
   DATABASE_URL="postgresql://user:password@host:port/database"
   ```

### Via l'API Render (Alternative)

Si vous préférez utiliser l'API, le script `get-render-db-info.ps1` a été créé pour récupérer automatiquement ces informations.

## Prochaines Étapes

Une fois l'URL de connexion récupérée :

1. **Mettre à jour .env**
   ```bash
   cd c:\Users\Dimitri\claude\server
   # Éditez .env et remplacez DATABASE_URL
   ```

2. **Appliquer le schéma Prisma**
   ```bash
   npx prisma db push
   ```

3. **Tester la connexion**
   ```bash
   node test-db.js
   ```

4. **Ouvrir Prisma Studio (optionnel)**
   ```bash
   npx prisma studio
   ```

## Remarques Importantes

- ⚠️ **Limite Gratuite** : Render autorise 1 seule base de données PostgreSQL gratuite par compte
- 🔒 **Sécurité** : Ne partagez jamais votre URL de connexion publiquement
- 📝 **Backup** : L'URL est également sauvegardée dans `server\.env.render` si le script a réussi
