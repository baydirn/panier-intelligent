# 🛠️ Guide de Configuration Admin

## Configuration Complétée ✅

Votre système admin est maintenant prêt! Voici comment l'utiliser:

## 🚀 Démarrage Local

### 1. Backend (Express + Puppeteer)
```bash
cd backend
npm run dev
```
- Serveur: http://localhost:3001
- Health check: http://localhost:3001/api/health
- **Note**: Le backend doit être démarré avant le frontend

### 2. Frontend (React + Vite)
```bash
npm run dev
```
- Application: http://localhost:5174
- Page admin: http://localhost:5174/admin

## 🔐 Accès Admin

### Mot de passe par défaut
- **Password**: `MonMotDePasseSecurise2024!`
- Modifiable dans: `backend/.env` → `ADMIN_PASSWORD=...`

### URL de connexion
1. Naviguez vers: **http://localhost:5174/admin**
2. Entrez le mot de passe admin
3. Accédez au dashboard de scraping

**⚠️ La route `/admin` est cachée** - elle n'apparaît pas dans la navigation. Seuls les admins qui connaissent l'URL peuvent y accéder.

## 📦 Flux de Travail Admin

### 1. Se connecter
- Ouvrir `/admin`
- Entrer le mot de passe
- JWT token valide 24h

### 2. Scraper les prix
- Cliquer sur "🔄 Scraper IGA"
- Attendre 10-15 secondes
- 24 produits détectés automatiquement

### 3. Valider les produits
- Cocher les produits corrects (checkbox ✓)
- Modifier les prix/noms/volumes si nécessaire
- Supprimer les produits erronés (🗑️)

### 4. Publier
- Cliquer sur "✅ Publier les validés"
- Seuls les produits cochés seront publiés
- Les utilisateurs réguliers verront les produits publiés

## 🌐 API Backend

### Endpoints disponibles

#### 1. Login Admin
```http
POST /api/admin/login
Content-Type: application/json

{
  "password": "MonMotDePasseSecurise2024!"
}
```
**Réponse**: `{ "success": true, "token": "eyJhbGciOi..." }`

#### 2. Vérifier Token
```http
GET /api/admin/verify
Authorization: Bearer <token>
```

#### 3. Scraper IGA
```http
POST /api/admin/scrape/iga
Authorization: Bearer <token>
Content-Type: application/json

{
  "options": { "headless": true }
}
```
**Réponse**: `{ "success": true, "products": [...], "totalFound": 24 }`

#### 4. Publier Produits
```http
POST /api/admin/publish
Authorization: Bearer <token>
Content-Type: application/json

{
  "products": [
    {
      "name": "Pommes Gala",
      "price": 2.99,
      "volume": "3 lb",
      "category": "Fruits",
      "validFrom": "2024-01-15",
      "validTo": "2024-01-21"
    }
  ]
}
```

## 🔧 Configuration

### Variables d'environnement

#### Backend (`backend/.env`)
```env
PORT=3001
ADMIN_PASSWORD=MonMotDePasseSecurise2024!
JWT_SECRET=votre-jwt-secret-tres-long-et-aleatoire-minimum-32-caracteres
FRONTEND_URL=http://localhost:5174
```

#### Frontend (`.env`)
```env
VITE_BACKEND_URL=http://localhost:3001
```

## 🚢 Déploiement Production

### Backend (Railway / Render)

1. **Créer un nouveau service**
   - Railway: https://railway.app
   - Render: https://render.com

2. **Connecter le repo GitHub**
   - Root directory: `backend/`
   - Build command: `npm install`
   - Start command: `npm start`

3. **Configurer les variables d'environnement**
   ```
   ADMIN_PASSWORD=VotreMotDePasseSecurisé123!
   JWT_SECRET=votre-secret-jwt-production-64-caracteres-minimum...
   FRONTEND_URL=https://votre-app.vercel.app
   PORT=3001
   ```

4. **Obtenir l'URL du backend**
   - Exemple: `https://votre-backend.up.railway.app`

### Frontend (Vercel)

1. **Déployer sur Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Configurer les variables d'environnement**
   - Dashboard Vercel → Settings → Environment Variables
   - Ajouter: `VITE_BACKEND_URL=https://votre-backend.up.railway.app`

3. **Redéployer**
   ```bash
   vercel --prod
   ```

### Tester en production
1. Ouvrir: `https://votre-app.vercel.app/admin`
2. Se connecter avec le mot de passe production
3. Tester le scraping IGA
4. Valider et publier

## 📊 Monitoring

### Logs Backend
```bash
# Railway
railway logs

# Render
# Voir dans le dashboard
```

### Tester la santé
```bash
curl https://votre-backend.up.railway.app/api/health
```

## 🔒 Sécurité

### Recommandations
- ✅ JWT tokens expirés après 24h (auto-reconnexion nécessaire)
- ✅ CORS configuré pour bloquer autres domaines
- ✅ Mot de passe admin stocké dans .env (jamais dans le code)
- ✅ Route `/admin` cachée de la navigation
- ⚠️ Changez `ADMIN_PASSWORD` et `JWT_SECRET` en production!

### Générer un JWT secret sécurisé
```bash
# Dans Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🐛 Dépannage

### Backend ne démarre pas
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### "401 Unauthorized" en frontend
- Token expiré → Se reconnecter sur `/admin`
- Vérifier que `VITE_BACKEND_URL` est correct dans `.env`

### CORS Error
- Vérifier `FRONTEND_URL` dans `backend/.env`
- Doit correspondre à l'URL exacte du frontend

### Scraping échoue
- Vérifier les logs backend (terminal)
- Tester manuellement: `node scripts/test-iga-scraper.js`
- IGA a peut-être changé son HTML (mettre à jour les sélecteurs)

## 📝 Prochaines Étapes

- [ ] Ajouter scrapers Metro et Maxi
- [ ] Implémenter stockage des produits publiés (DB ou fichier JSON)
- [ ] Ajouter dashboard analytics admin
- [ ] Historique des publications
- [ ] Notifications email après publication

## 🎯 Architecture Finale

```
┌─────────────────────────────────────────────────┐
│         Frontend (Vercel)                       │
│  http://localhost:5174                          │
│  https://votre-app.vercel.app                   │
│                                                 │
│  ┌──────────────┐    ┌────────────────────┐    │
│  │  /admin      │    │  Public Pages      │    │
│  │  (Protected) │    │  /liste, /analyse  │    │
│  └──────┬───────┘    └────────────────────┘    │
│         │                                       │
└─────────┼───────────────────────────────────────┘
          │ JWT Token
          │ Authorization: Bearer <token>
          ▼
┌─────────────────────────────────────────────────┐
│         Backend (Railway/Render)                │
│  http://localhost:3001                          │
│  https://votre-backend.up.railway.app           │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Express API                            │   │
│  │  • POST /api/admin/login                │   │
│  │  • POST /api/admin/scrape/iga           │   │
│  │  • POST /api/admin/publish              │   │
│  └──────────┬──────────────────────────────┘   │
│             │                                   │
│             ▼                                   │
│  ┌─────────────────────────────────────────┐   │
│  │  Puppeteer Scraper                      │   │
│  │  • IGA.net → 24 produits                │   │
│  │  • Metro (à venir)                      │   │
│  │  • Maxi (à venir)                       │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## 🎉 Félicitations!

Votre système admin de scraping est opérationnel! Vous pouvez maintenant:
1. ✅ Scraper IGA automatiquement
2. ✅ Valider les données avant publication
3. ✅ Publier uniquement les produits corrects
4. ✅ Protéger l'accès avec mot de passe

**Page admin**: http://localhost:5174/admin  
**Mot de passe**: `MonMotDePasseSecurise2024!`
