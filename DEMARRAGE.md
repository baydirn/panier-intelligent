# 🚀 Guide de Démarrage - Panier Intelligent

## ✅ Configuration Actuelle (23 nov 2025)

### Backend
- ✅ Port: **3001**
- ✅ Node: v24.11.0
- ✅ Dépendances: installées (uuid, pg, express, etc.)
- ✅ `.env` configuré avec ADMIN_PASSWORD
- ⚠️ PostgreSQL: **désactivé** (DB_PASSWORD vide)
  - Routes `/api/prices/*` commentées dans `server.js`
  - Pour activer: voir `backend/db/README.md`

### Frontend
- ⏳ Port: **5174**
- ✅ Node: v24.11.0
- ✅ Dépendances: installées (React, Vite, Zustand, etc.)

---

## 🔧 Démarrer les Serveurs

### Méthode Recommandée: PowerShell Externe

**Pourquoi?** Les terminaux intégrés VS Code ont un problème qui fait quitter les processus Node immédiatement.

#### 1. Backend (dans une fenêtre PowerShell séparée)

```powershell
cd "C:\Users\baydi\OneDrive\Documents\Panier Epicerie IA 2\backend"
.\start.ps1
```

**Vous devriez voir:**
```
╔═══════════════════════════════════════════╗
║   Panier Intelligent - Backend API       ║
╠═══════════════════════════════════════════╣
║   Port: 3001                            ║
║   Frontend: http://localhost:5174               ║
║   Admin protégé: Oui                      ║
╚═══════════════════════════════════════════╝

✅ Serveur démarré avec succès
```

#### 2. Frontend (dans UNE AUTRE fenêtre PowerShell)

```powershell
cd "C:\Users\baydi\OneDrive\Documents\Panier Epicerie IA 2"
.\start-frontend.ps1
```

**Vous devriez voir:**
```
VITE v5.4.21  ready in XXX ms

➜  Local:   http://localhost:5174/
➜  Network: http://192.168.X.X:5174/
```

---

## 🧪 Tester que Tout Fonctionne

### 1. Tester le Backend (dans une 3e fenêtre PowerShell ou un navigateur)

```powershell
# Health check
Invoke-RestMethod -Uri http://localhost:3001/api/health -Method Get

# Connexion admin
Invoke-RestMethod -Uri http://localhost:3001/api/admin/login `
  -Method Post `
  -Body (@{password='MonMotDePasseSecurise2024!'} | ConvertTo-Json) `
  -ContentType 'application/json'
```

**Ou dans un navigateur:**
- http://localhost:3001/api/health → devrait afficher `{"status":"ok",...}`

### 2. Tester le Frontend

Ouvrir dans un navigateur:
- http://localhost:5174/ → Page d'accueil
- http://localhost:5174/admin → Interface admin (mot de passe: `MonMotDePasseSecurise2024!`)

### 3. Vider le Cache (SI PROBLÈMES D'AFFICHAGE)

http://localhost:5174/force-update.html

Cliquer sur "Vider tous les caches et recharger"

---

## 🐛 Tester les Bugs Corrigés

### Bug #1: Suppression doublon supprimait toute la liste

**Avant:** Sélectionner une alternative dans les suggestions supprimait tous les produits

**Après (correction ligne 90 de ProductItem.jsx):**
1. Ajouter un produit avec des doublons (ex: "Lait")
2. Voir les suggestions d'alternatives
3. Cliquer sur une alternative
4. ✅ Seul le doublon est remplacé, pas toute la liste

### Bug #2: Onglet Magasin ne groupait pas par magasin

**Avant:** Produits non regroupés par magasin dans l'onglet Magasin

**Après (à vérifier):**
1. Ajouter plusieurs produits de différents magasins
2. Aller dans l'onglet "Magasin"
3. ✅ Produits devraient être regroupés par magasin

---

## 📊 Tester le Module PriceHistory (Optionnel - Requis PostgreSQL)

**⚠️ Prérequis:** Installer PostgreSQL d'abord (voir `backend/db/README.md`)

Une fois PostgreSQL configuré:

1. Éditer `backend/.env`:
   ```env
   DB_PASSWORD=VotreMotDePassePostgres
   ```

2. Décommenter dans `backend/server.js` (lignes 7 et 406):
   ```javascript
   import pricesRouter from './routes/prices.js'
   // ...
   app.use('/api/prices', pricesRouter)
   ```

3. Exécuter migrations:
   ```powershell
   cd backend
   npm run migrate
   ```

4. Redémarrer backend (`.\start.ps1`)

5. Tester endpoints:
   ```powershell
   # Ajouter un prix
   Invoke-RestMethod -Uri http://localhost:3001/api/prices `
     -Method Post `
     -Body (@{
       productId='lait-2l'
       productName='Lait 2L'
       storeId='metro-001'
       storeName='Metro'
       prix=5.99
       source='manual'
     } | ConvertTo-Json) `
     -ContentType 'application/json'
   
   # Voir l'historique
   Invoke-RestMethod -Uri http://localhost:3001/api/prices/history/lait-2l
   ```

6. Utiliser le composant frontend:
   ```jsx
   import PriceHistoryChart from './components/PriceHistoryChart'
   
   <PriceHistoryChart 
     productId="lait-2l"
     productName="Lait 2L"
   />
   ```

---

## 🔐 Tester l'Interface Admin

1. Aller sur http://localhost:5174/admin

2. Se connecter:
   - Mot de passe: `MonMotDePasseSecurise2024!`

3. Tester les scrapers:
   - **Scraper Test:** Génère 55 produits de test
   - **Scraper Multi-Store:** Génère 250 produits (50 produits × 5 épiceries)
   - **Scraper IGA API:** Scrape les vrais produits IGA (lent, utilise API réelle)

4. Valider et publier les produits

5. Vérifier qu'ils apparaissent dans l'onglet "Liste" de l'app

---

## ❓ Dépannage

### Le backend ne démarre pas dans VS Code

**Solution:** Utiliser une fenêtre PowerShell EXTERNE (pas le terminal intégré VS Code)

### "Cannot find package 'uuid'"

**Solution:**
```powershell
cd backend
Remove-Item -Recurse -Force node_modules
npm install
```

### Le frontend affiche une page blanche

**Solution:** Vider le cache avec http://localhost:5174/force-update.html

### Erreur "Failed to connect to PostgreSQL"

**Solution:** C'est normal! PostgreSQL est optionnel pour tester les scrapers/admin.
- Les endpoints `/api/prices/*` sont désactivés
- Pour activer: installer PostgreSQL (voir `backend/db/README.md`)

### Les modifications de code n'apparaissent pas

**Solution:** 
1. Service Worker cache agressif → http://localhost:5174/force-update.html
2. Ctrl+Shift+R dans le navigateur (hard refresh)
3. Vérifier que le bon fichier est modifié (pas dans `node_modules` ou un cache)

---

## 📁 Structure des Fichiers Importants

```
Panier Epicerie IA 2/
├── backend/
│   ├── server.js              # Serveur Express principal
│   ├── .env                   # Config (ADMIN_PASSWORD, DB_PASSWORD)
│   ├── start.ps1              # Script de démarrage backend
│   ├── models/
│   │   └── PriceHistory.js    # Model historique prix (requis PostgreSQL)
│   ├── routes/
│   │   └── prices.js          # Routes API prix (désactivées sans PostgreSQL)
│   ├── config/
│   │   └── database.js        # Config PostgreSQL
│   ├── db/
│   │   ├── schema.sql         # Schéma DB complet
│   │   ├── migrations/
│   │   │   └── 001_create_price_history.sql
│   │   └── README.md          # Guide installation PostgreSQL
│   └── scrapers/
│       ├── igaScraper.js      # Scraper Puppeteer (lent)
│       └── igaApiScraper.js   # Scraper API (rapide)
│
├── src/
│   ├── components/
│   │   ├── ProductItem.jsx    # ✅ CORRIGÉ: Bug doublon ligne 90
│   │   └── PriceHistoryChart.jsx  # Graphique Chart.js (requis PostgreSQL)
│   ├── store/
│   │   └── useAppStore.js     # State Zustand
│   └── lib/
│       └── db.js              # IndexedDB via localforage
│
├── public/
│   ├── sw.js                  # Service Worker (v2-nov23)
│   ├── force-update.html      # 🔧 Utilitaire vider cache
│   └── debug-products.html    # 🔍 Debug IndexedDB
│
├── start-frontend.ps1         # Script de démarrage frontend
└── PRICE_HISTORY_USAGE.md     # Guide module PriceHistory
```

---

## 🎯 Prochaines Étapes (Plan Incrémental Semaines 1-2)

- [x] Task 1: Corriger bugs (doublon, React keys)
- [x] Task 2: Implémenter PriceHistory (BA6)
- [ ] Task 3: Service de sync local/central
- [ ] Task 4: Tests unitaires (Vitest, 80% coverage)
- [ ] Task 5: Documentation architecture (ARCHITECTURE.md)

**Phase 2-6 (Semaines 3-8):**
- Normalisation IA (embeddings, fuzzy matching)
- OCR Pro (GPT-4 Vision)
- Géolocalisation (distances réelles)
- Agent Intelligent (LangChain)
- Déploiement Streamlit

---

## 💡 Notes Importantes

1. **PostgreSQL optionnel:** Le système fonctionne sans PostgreSQL pour tester scrapers et admin
2. **Cache agressif:** Service Worker v2-nov23 peut causer des problèmes → force-update.html
3. **Terminaux VS Code:** Problème connu, utiliser PowerShell externe
4. **Mot de passe admin:** `MonMotDePasseSecurise2024!` (défini dans `.env`)

---

**Dernière mise à jour:** 23 novembre 2025
**Version backend:** 1.0.0
**Version Node:** v24.11.0
