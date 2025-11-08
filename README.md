# Panier Intelligent 🛒

Application React moderne pour constituer des listes d'épicerie intelligentes et optimiser tes achats.

## ✨ Fonctionnalités

### 📝 Gestion de liste
- Ajouter, modifier et supprimer des produits
- Recherche et filtres avancés (par nom, statut, type)
- Tri par date, nom ou prix
- Interface responsive et animations fluides

### 📊 Analyse et optimisation
- Comparaison automatique des prix entre magasins
- Algorithme d'optimisation pour minimiser les coûts
- Visualisation des économies potentielles
- Suggestions de combinaisons de magasins

### 🏪 Mode magasin
- Liste groupée par magasin
- Itinéraire suggéré optimisé
- Progression en temps réel
- Interface tactile pour cocher les produits

### 🔄 Produits récurrents
- Sauvegarde de templates de produits fréquents
- Organisation par catégories
- Ajout rapide à la liste courante
- Gestion de listes récurrentes

### ⚙️ Paramètres
- Configuration des préférences d'optimisation
- Export/Import de listes en JSON
- Statistiques détaillées
- Gestion des magasins favoris

## 🚀 Démarrage rapide

### Prérequis
- Node.js (>=18)
- npm ou yarn

### Installation

1. Clone le projet et installe les dépendances :

```powershell
npm install
```

2. Démarre le serveur de développement :

```powershell
npm run dev
```

3. Ouvre ton navigateur à `http://localhost:5173`

## 🛠️ Technologies

- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **State**: Zustand
- **Styling**: TailwindCSS v3
- **Storage**: LocalForage (IndexedDB)
- **Mock API**: Axios

## 📁 Structure du projet

```
src/
├── components/        # Composants réutilisables
│   ├── Header.jsx
│   ├── ProductItem.jsx
│   ├── ProgressBar.jsx
│   ├── StoreComparisonCard.jsx
│   ├── Toast.jsx
│   └── ToastProvider.jsx
├── pages/            # Pages de l'application
│   ├── Liste.jsx     # Gestion de liste
│   ├── Analyse.jsx   # Comparaison de prix
│   ├── Magasin.jsx   # Mode shopping
│   ├── Recurrentes.jsx  # Templates récurrents
│   └── Parametres.jsx   # Configuration
├── services/         # Logique métier
│   ├── db.js        # Persistence (LocalForage)
│   ├── apiPrix.js   # Mock API de prix
│   └── optimisation.js  # Algorithmes
├── store/           # State management
│   └── useAppStore.js
└── utils/           # Utilitaires
```

## 📝 Notes techniques

### Persistence
- Utilise `localforage` (IndexedDB) pour le stockage côté navigateur
- Alternative à `better-sqlite3` qui nécessite une compilation native
- Parfait pour le prototypage et l'utilisation locale

### Optimisation
- Algorithme de force brute pour les petites combinaisons (≤5 magasins)
- Calcul des économies basé sur la moyenne des prix
- Tri des résultats par coût total croissant

### API Mock
- Prix déterministes générés à partir du nom du produit
- 4 magasins simulés: IGA, Maxi, Metro, Walmart
- Délai simulé de 200ms pour réalisme

## 🔮 Prochaines étapes

- [ ] Intégration API réelle de prix
- [ ] Backend Express avec SQLite
- [ ] Géolocalisation des magasins
- [ ] Optimisation d'itinéraire avec carte
- [ ] Mode hors-ligne (PWA)
- [ ] Notifications push
- [ ] Partage de listes

## 📄 License

MIT

---

Développé avec ❤️ pour simplifier tes courses

## ⚙️ Variables d'environnement (Autonomie)

Configure ces variables pour activer la mise à jour automatique hebdomadaire des prix et l'affichage du statut dans l'app.

- VITE_PRICE_DATA_URL: URL publique vers le fichier JSON agrégé (ex: https://raw.githubusercontent.com/<owner>/<repo>/main/prices.json). Utilisée par le frontend.
- PRICE_META_URL: URL publique vers le fichier meta (ex: https://raw.githubusercontent.com/<owner>/<repo>/main/prices-meta.json). Optionnel, sinon fallback via /api/price-status.
- PRICE_DATA_URL: (serveur) URL pour que l'API /api/price-status récupère les prix s'il n'y a pas de meta.
- PRICE_SOURCE_URLS: Liste d'URLs sources (séparées par virgule) à agréger par /api/update-prices (ex: https://example.com/storeA.json,https://example.com/storeB.json). **Note**: Le scraper Flipp (`/api/scrapers/flipp`) est automatiquement inclus, pas besoin de l'ajouter ici.
- CRON_SECRET: Jeton secret pour protéger /api/update-prices, /api/scrapers/flipp et /api/price-status en production (requiert ?secret=... pour y accéder).
- GITHUB_REPO: owner/repo pour publier automatiquement prices.json sur GitHub.
- GITHUB_TOKEN: PAT avec droits repo (contenus) pour publier les fichiers.
- GITHUB_BRANCH: Branche cible (par défaut: main).
- GITHUB_PATH: Chemin du fichier agrégé (par défaut: prices.json).
- GITHUB_META_PATH: Chemin du fichier méta (par défaut: prices-meta.json).
- GITHUB_HISTORY_DIR: Dossier pour les snapshots hebdo (ex: prices-history). Optionnel.

### 🛒 Scraper Flipp

L'endpoint `/api/scrapers/flipp` récupère automatiquement les circulaires de **IGA, Walmart, Costco, Maxi, Super C, Metro** via l'API publique de Flipp.com. Il est appelé automatiquement par `/api/update-prices` (sauf si `?skipFlipp=1`). Cron configuré pour s'exécuter chaque lundi à 03:00 UTC.

CI (facultatif): `.github/workflows/scrape-prices.yml` peut récupérer les sources hebdo (PRICE_SOURCE_URLS via Repository variables) et pousser `raw-prices.json`.

