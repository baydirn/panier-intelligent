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

### Standards & Domain Contracts
- Normalisation produit: `normalizeProductName({nom, marque?, volume?}) -> { baseName, marque, volume, nameKey, tokens }`
- Magasins: `canonicalizeStoreName(name)` et catalogue commun (`src/domain/stores.js`)
- Unités: `parseUnit`, `toCanonical`, `computeUnitPrice`
- Scoring multi-critères: `scoreCombination(inputs, weights)` avec `DEFAULT_WEIGHTS`
- Upload OCR (sécurité): admin-only par défaut. Flag: `VITE_COMMUNITY_OCR_UPLOAD_ENABLED`

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

### UI & Sécurité (Frontend)
- VITE_COMMUNITY_OCR_UPLOAD_ENABLED: `true|false` (défaut: false)
	- false: le bouton "Contribuer une circulaire (OCR)" est masqué pour les utilisateurs non-admin
	- true: permet l'upload communautaire (déconseillé en prod sans modération)

### 🛒 Données de démarrage (Québec)

L'endpoint `/api/scrapers/flipp` (nom historique) génère maintenant un **jeu de données réaliste pré-curé** pour 6 bannières alimentaires du Québec: **IGA, Walmart, Costco, Maxi, Super C, Metro**.

Raison: l'ancienne API Flipp ne retourne plus de données publiques. Pour offrir une base exploitable immédiatement, un dataset statique est fourni et régénéré avec `updatedAt` du jour.

Caractéristiques:
- 15 produits typiques par magasin (90 items total)
- Formats standardisés (kg, L, unités, g, ml)
- Prix plausibles de détail (novembre 2025) — à adapter si inflation
- Source marquée `_source: curated-qc-prices`

Usage:
- Appel direct: `/api/scrapers/flipp?secret=CRON_SECRET&limit=15`
- Inclus automatiquement par `/api/update-prices` (retirer avec `?skipFlipp=1`)
- Fichier local bootstrap: `public/prices.initial.json`

Remplacement futur possible par scraping légal des circulaires ou contribution communautaire.

CI (facultatif): `.github/workflows/scrape-prices.yml` peut récupérer les sources hebdo (PRICE_SOURCE_URLS via Repository variables) et pousser `raw-prices.json`.

## 🔧 Dépannage

### Problème: Géolocalisation ne fonctionne pas

**Symptômes**: Message "Geolocation has been disabled in this document by permissions policy" ou géolocalisation refusée.

**Solutions**:
1. **Utiliser le code postal** : Au lieu de la géolocalisation GPS, entrez votre code postal (ex: G3A 2W5, H1A 1B1) dans le champ prévu et cliquez sur "📍 Utiliser code postal"
2. **Autoriser la géolocalisation** : 
   - Dans Chrome/Edge: Cliquez sur l'icône de cadenas (ou info) à gauche de l'URL → Site settings → Location → Allow
   - Dans Firefox: Cliquez sur l'icône (i) à gauche de l'URL → Permissions → Location → Allow
3. **Si sur HTTP local**: Certains navigateurs bloquent la géolocalisation sur HTTP. Utilisez `https://localhost` ou le code postal comme alternative

**Codes postaux supportés**: Montréal (H1-H9), Québec (G1-G8), Laval (H7), Gatineau (J8-J9), Sherbrooke (J1), Trois-Rivières (G8-G9), Rive-Nord (J6-J7)

### Problème: Upload OCR ne s'affiche pas

**Symptômes**: Le bouton "📄 Contribuer une circulaire (OCR)" est absent ou grisé.

**Solutions**:
1. **Vérifier la variable d'environnement**: Assurez-vous que `VITE_COMMUNITY_OCR_UPLOAD_ENABLED=true` est défini dans `.env.local`
2. **Redémarrer le serveur**: Après modification de `.env.local`, arrêtez et redémarrez `npm run dev`
3. **Vérifier dans la console**: Ouvrez les DevTools (F12) → Console et cherchez des erreurs liées à `tesseract.js` ou `pdfjs-dist`
4. **Descendre dans la page**: Le bouton OCR est dans la section "Base de prix hebdomadaire" en bas de la page Paramètres

### Problème: OCR échoue lors du traitement

**Symptômes**: Erreur lors de l'analyse d'image ou PDF, ou "Aucun produit détecté".

**Solutions**:
1. **Qualité de l'image**: Utilisez une image claire, bien éclairée, avec des prix visibles et nets
2. **Taille du fichier**: Maximum 10MB. Réduisez la taille si nécessaire
3. **Format supporté**: Images (JPG, PNG, WEBP) ou PDF (max 15 pages analysées)
4. **Langue**: L'OCR est configuré pour français + anglais. Si votre circulaire contient beaucoup de symboles, l'analyse peut échouer
5. **Vérifier la console**: Regardez les logs dans DevTools → Console pour des détails sur l'erreur

### Problème: Aucun magasin trouvé

**Symptômes**: Liste vide après avoir activé la géolocalisation ou entré un code postal.

**Solutions**:
1. **Ajuster le rayon de recherche**: Dans Paramètres → "Rayon de recherche (km)", augmentez la valeur (ex: 10, 20, 50 km)
2. **Vérifier le code postal**: Assurez-vous qu'il est bien formaté (ex: G3A 2W5, pas g3a2w5)
3. **Catalogue de magasins**: Le fichier `public/stores.qc.json` contient la liste des magasins. Vérifiez qu'il existe et contient des coordonnées GPS
4. **Ajouter manuellement**: Si aucun magasin proche n'est répertorié, vous pouvez toujours saisir des produits et comparer les prix disponibles

### Problème: Les prix ne se mettent pas à jour

**Symptômes**: Les prix restent les mêmes après avoir cliqué sur "🔁 Forcer la mise à jour".

**Solutions**:
1. **Vérifier l'URL source**: Dans Paramètres → "Base de prix hebdomadaire", cliquez sur "🧪 Tester la source" pour vérifier que l'URL est accessible
2. **Console réseau**: Ouvrez DevTools → Network, filtrez par "weekly-prices", et vérifiez s'il y a des erreurs 404 ou CORS
3. **Cache**: Videz le cache du navigateur (Ctrl+Shift+Delete) et rechargez la page
4. **Déploiement**: Si en production, assurez-vous que `VITE_PRICE_DATA_URL` pointe vers une URL publique valide (ex: GitHub raw, CDN)

### Besoin d'aide supplémentaire?

Ouvrez une issue sur GitHub avec:
- Description du problème
- Étapes pour reproduire
- Capture d'écran si applicable
- Messages d'erreur de la console (F12 → Console)


