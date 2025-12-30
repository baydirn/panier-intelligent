# 🛒 Panier Intelligent - Système de comparaison de prix

## 🎯 Vue d'ensemble

**Panier Intelligent** est une application web complète permettant de comparer les prix entre différentes épiceries québécoises (IGA, Costco, Metro, Maxi, Super C).

### Fonctionnalités principales
- ✅ **Base de données enrichie** : 275 produits (55 items × 5 épiceries)
- ✅ **Interface admin sécurisée** : Gestion et validation des prix
- ✅ **Périodes de validité** : Suivi des circulaires hebdomadaires
- ✅ **Comparaison intelligente** : Tri automatique du moins cher au plus cher
- ✅ **Statistiques temps réel** : Suivi des prix actifs/expirés par épicerie

---

## 🚀 Démarrage rapide

### 1. Pré-requis
- Node.js v18+ installé
- Ports 3001 et 5174 disponibles

### 2. Installation

```powershell
# Cloner le projet
cd "c:\Users\baydi\OneDrive\Documents\Panier Epicerie IA 2"

# Installer les dépendances
npm install

# Installer les dépendances backend
cd backend
npm install
cd ..
```

### 3. Configuration

Créez `backend/.env` :
```env
ADMIN_PASSWORD=MonMotDePasseSecurise2024!
JWT_SECRET=votre-secret-jwt-très-long-et-sécurisé-changez-moi
FRONTEND_URL=http://localhost:5174
PORT=3001
IGA_POSTAL_CODE=G3A2W5
```

### 4. Lancement

**Terminal 1 - Backend :**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend :**
```powershell
npm run dev
```

### 5. Accès

- **Application utilisateur** : http://localhost:5174
- **Interface admin** : http://localhost:5174/admin
- **API Backend** : http://localhost:3001

---

## 📚 Documentation complète

| Document | Description |
|----------|-------------|
| **GUIDE_ADMIN.md** | Guide d'utilisation de l'interface admin |
| **TEST_GUIDE.md** | Procédures de test détaillées (checklist) |
| **RESUME_SYSTEME.md** | Architecture et vue d'ensemble technique |
| **CHECKLIST.md** | Liste des fonctionnalités implémentées |

---

## 🧪 Test rapide

### Script automatique
```powershell
.\test-api.ps1
```

Ce script teste automatiquement :
1. ✅ Health check du backend
2. ✅ Authentification admin
3. ✅ Génération de 55 produits
4. ✅ Génération de 275 produits (5 épiceries)
5. ✅ Comparaison de prix
6. ✅ Statistiques par épicerie

### Test manuel (2 minutes)

1. **Login admin**
   - Ouvrir http://localhost:5174/admin
   - Mot de passe : `MonMotDePasseSecurise2024!`

2. **Générer les données**
   - Cliquer sur **🌟 5 Épiceries**
   - Attendre : 275 produits générés

3. **Valider et publier**
   - Cocher quelques produits
   - Cliquer **✅ Publier les validés**

4. **Vérifier**
   - Les stats affichent les produits publiés
   - Retour à l'app : rechercher un produit

---

## 🏗️ Architecture

```
Frontend (React + Vite)
├── src/pages/Admin.jsx          # Interface admin
├── src/services/weeklyPrices.js # Gestion IndexedDB
└── src/App.jsx                  # Routing

Backend (Express)
├── server.js                    # API REST
├── scrapers/igaScraper.js       # Scraper Puppeteer
└── scrapers/igaApiScraper.js    # Scraper API

Base de données
└── IndexedDB (weekly_prices_v1) # Stockage local navigateur
```

---

## 📊 Base de données - 275 produits

### Catalogue (55 produits uniques)

| Catégorie | Nombre | Exemples |
|-----------|--------|----------|
| 🍎 Fruits & Légumes | 10 | Pommes, Bananes, Tomates |
| 🥛 Produits laitiers | 10 | Lait 2%, Yogourt, Fromage |
| 🥩 Viandes & Poissons | 8 | Poulet, Bœuf, Saumon |
| 🍞 Boulangerie | 5 | Pain, Bagels, Tortillas |
| 🍝 Épicerie sèche | 10 | Pâtes, Riz, Céréales |
| 🥤 Boissons | 5 | Jus, Café, Thé |
| 🍪 Collations | 7 | Chips, Biscuits, Crème glacée |

### Épiceries (5 enseignes)

| Épicerie | Stratégie prix | Exemple Lait 2% |
|----------|----------------|-----------------|
| IGA | Prix de base | 4.49$ |
| Costco | -15% (entrepôt) | 3.82$ ⭐ |
| Metro | +5% (premium) | 4.71$ |
| Maxi | -8% (rabais) | 4.13$ |
| Super C | -12% (discount) | 3.95$ |

**Total** : 55 produits × 5 épiceries = **275 prix**

---

## 🔐 Sécurité

### Authentification
- **Méthode** : JWT (JSON Web Token)
- **Durée** : 24 heures
- **Stockage** : localStorage (côté client)
- **Protection** : Middleware `requireAdmin()` sur toutes les routes admin

### Variables sensibles
- Mot de passe admin dans `.env`
- Secret JWT dans `.env`
- Pas d'exposition dans les logs

---

## 🛠️ API Endpoints

### Publics
```
GET  /api/health          # Vérification état serveur
```

### Admin (nécessite JWT)
```
POST /api/admin/login                # Authentification
GET  /api/admin/verify               # Vérification token
POST /api/admin/scrape/test          # Générer 55 produits
POST /api/admin/scrape/all-stores    # Générer 275 produits
POST /api/admin/scrape/iga           # Scraper IGA (bloqué)
POST /api/admin/scrape/metro         # Non implémenté
POST /api/admin/scrape/maxi          # Non implémenté
POST /api/admin/publish              # Publier produits validés
```

---

## 📱 Utilisation

### Côté Admin

1. **Connexion** : http://localhost:5174/admin
2. **Génération** : Cliquer "5 Épiceries"
3. **Validation** : Cocher les produits à publier
4. **Édition** : Modifier prix, dates, marques
5. **Publication** : Cliquer "Publier les validés"
6. **Statistiques** : Voir les métriques temps réel

### Côté Utilisateur

1. **Recherche** : Taper un produit (ex: "lait")
2. **Comparaison** : Voir les 5 prix triés
3. **Ajout panier** : Sélectionner le meilleur prix
4. **Total** : Calculer les économies

---

## 🎓 Fonctionnalités avancées

### Gestion des périodes de validité

Chaque prix a :
- **validFrom** : Date de début (vendredi)
- **validTo** : Date de fin (jeudi suivant)

La recherche filtre automatiquement les prix expirés.

### Déduplication intelligente

Lors de la publication :
1. Si produit existe (même nom + épicerie) → **garde le prix le plus bas**
2. Si nouveau → ajoute à la base

Exemple :
```
Lait 2% IGA : 4.49$ (publié)
Lait 2% IGA : 5.20$ (nouveau) → IGNORÉ (4.49$ gardé)
Lait 2% IGA : 3.99$ (nouveau) → REMPLACE (3.99$ < 4.49$)
```

### Statistiques temps réel

Le dashboard affiche :
- Total de produits
- Prix actifs vs expirés
- Nombre d'épiceries
- Prix moyen par épicerie
- Nombre de produits par épicerie

---

## 🔧 Développement

### Structure du code

```
src/
├── pages/
│   ├── Admin.jsx              # Interface admin (validation, stats)
│   ├── Home.jsx               # Page d'accueil
│   └── NotFound.jsx           # 404
├── services/
│   ├── weeklyPrices.js        # Gestion IndexedDB + stats
│   └── scraperSync.js         # Synchronisation scraping
├── components/
│   ├── Card.jsx               # Composant carte
│   ├── Button.jsx             # Boutons personnalisés
│   ├── Badge.jsx              # Tags de statut
│   └── Input.jsx              # Champs de formulaire
└── App.jsx                    # Routing principal

backend/
├── server.js                  # API Express
├── scrapers/
│   ├── igaScraper.js          # Scraper Puppeteer
│   └── igaApiScraper.js       # Scraper API REST
└── .env                       # Variables d'environnement
```

### Ajout d'un nouveau produit

Dans `backend/server.js`, fonction `generateBaseProducts()` :

```javascript
{ 
  name: 'Produit X', 
  brand: 'Marque Y', 
  basePrice: 5.99, 
  volume: '500g', 
  category: 'Épicerie' 
}
```

### Ajout d'une nouvelle épicerie

Dans `POST /api/admin/scrape/all-stores` :

```javascript
const stores = [
  // ... existantes
  { name: 'Nouvelle Épicerie', priceMultiplier: 0.90 }
]
```

---

## 🐛 Dépannage

### Backend ne démarre pas
```powershell
# Vérifier le port 3001
netstat -ano | findstr :3001
# Si occupé, tuer le processus
Get-Process -Id <PID> | Stop-Process -Force
```

### Frontend ne se connecte pas
```powershell
# Vérifier VITE_BACKEND_URL
cat .env
# Doit pointer vers http://localhost:3001
```

### IndexedDB vide
```javascript
// Console navigateur (F12)
await localforage.getItem('weekly_prices_v1')
// Si null, aucun produit publié
```

### Recherche ne trouve rien
1. Vérifier qu'il y a des produits publiés (stats > 0)
2. Vérifier que `validTo` n'est pas expiré
3. Ouvrir DevTools > Application > IndexedDB

---

## 🚀 Améliorations futures

### Court terme
- [ ] Ajouter 100+ produits par épicerie
- [ ] Historique de prix avec graphiques
- [ ] Export CSV des données

### Moyen terme
- [ ] Scraping réel (contourner anti-bot)
- [ ] Upload PDF avec OCR amélioré
- [ ] Notifications push (baisse de prix)

### Long terme
- [ ] Application mobile native
- [ ] Intégration cartes de fidélité
- [ ] API publique pour développeurs

---

## 📞 Support

### Logs
- **Backend** : Console du terminal backend
- **Frontend** : DevTools Console (F12)
- **IndexedDB** : DevTools > Application > Storage

### Tests
```powershell
# Test automatique
.\test-api.ps1

# Health check manuel
Invoke-RestMethod -Uri http://localhost:3001/api/health
```

---

## 📄 Licence

Ce projet est un outil personnel d'apprentissage et de comparaison de prix.

---

## 🙏 Remerciements

Marques utilisées dans les données de test :
- Selection, Natrel, Québon, Oikos, Liberté
- Black Diamond, Saputo, Lactantia
- Exceldor, Olymel, Chiquita, Savoura
- Catelli, Barilla, Tropicana, Nabob
- Et bien d'autres marques québécoises et canadiennes

---

## ✨ Résumé

**Panier Intelligent** vous permet de :
- 📊 Comparer 275 prix entre 5 épiceries
- 💰 Économiser jusqu'à 20% sur vos courses
- ⏰ Suivre les circulaires hebdomadaires
- 🔍 Trouver le meilleur prix instantanément

**Le système est opérationnel et prêt à l'emploi ! 🎉**

---

**Bon usage ! 🛒💰**
