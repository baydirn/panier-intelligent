# Backend Panier Intelligent

Backend Node.js + Express pour le scraping admin.

## 🚀 Démarrage local

```bash
cd backend
npm install
cp .env.example .env
# Éditez .env et changez ADMIN_PASSWORD
npm run dev
```

Le serveur démarre sur http://localhost:3001

## 🔒 Sécurité

- Toutes les routes `/api/admin/*` requièrent un mot de passe
- Le mot de passe est dans `.env` (ADMIN_PASSWORD)
- Les utilisateurs normaux n'ont AUCUN accès au scraping

## 📡 API Endpoints

### Public
- `GET /api/health` - Health check

### Admin (Protégé par mot de passe)
- `POST /api/admin/login` - Authentification admin
- `POST /api/admin/scrape/iga` - Scraper IGA
- `POST /api/admin/scrape/metro` - Scraper Metro (TODO)
- `POST /api/admin/scrape/maxi` - Scraper Maxi (TODO)
- `POST /api/admin/publish` - Publier des produits validés

## 🌐 Déploiement

### Option 1: Railway (Recommandé - GRATUIT)
1. Créer compte sur https://railway.app
2. New Project → Deploy from GitHub
3. Sélectionner ce repo
4. Root Directory: `/backend`
5. Ajouter variables d'environnement:
   - `ADMIN_PASSWORD=VotreMotDePasse`
   - `FRONTEND_URL=https://votre-app.vercel.app`
6. Deploy!

### Option 2: Render (GRATUIT)
1. Créer compte sur https://render.com
2. New Web Service → Connect repo
3. Root Directory: `backend`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Ajouter variables d'environnement
7. Deploy!

### Option 3: Heroku
```bash
cd backend
heroku create panier-backend
heroku config:set ADMIN_PASSWORD=VotreMotDePasse
heroku config:set FRONTEND_URL=https://votre-app.vercel.app
git push heroku main
```

## 🔗 Connecter au Frontend

Dans le frontend, créer `.env`:
```
VITE_BACKEND_URL=https://votre-backend.railway.app
VITE_ADMIN_PASSWORD=VotreMotDePasse
```
