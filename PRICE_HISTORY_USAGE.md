# 📊 Guide d'Utilisation - Module Historique des Prix

## ✅ Ce qui a été implémenté

### Backend (PostgreSQL + Express)

1. **Schema DB** (`backend/db/schema.sql`)
   - Table `price_history` avec tracking temporel (valid_from, valid_to)
   - Indexes optimisés pour requêtes par produit/magasin
   - Vue matérialisée `price_trends` pour analytics
   - Fonctions SQL : `get_current_price()`, `detect_stale_prices()`

2. **Model** (`backend/models/PriceHistory.js`)
   - `addPrice()` - Ajouter un prix
   - `getCurrentPrice()` - Prix actuel produit+magasin
   - `getHistory()` - Historique avec filtres
   - `getPriceTrends()` - Tendances statistiques
   - `detectStalePrices()` - **RA9**: Détection prix obsolètes
   - `compareAcrossStores()` - Comparaison multi-magasins
   - `bulkInsert()` - Import batch (OCR)
   - `verifyPrice()` - **RA10**: Validation admin

3. **API Routes** (`backend/routes/prices.js`)
   ```
   GET  /api/prices/history/:productId      - Historique
   GET  /api/prices/current/:productId/:storeId  - Prix actuel
   GET  /api/prices/compare/:productId      - Comparaison magasins
   GET  /api/prices/trends/:productId       - Tendances
   GET  /api/prices/stale                   - Prix obsolètes (RA9)
   POST /api/prices                         - Ajouter prix
   POST /api/prices/bulk                    - Import batch
   PATCH /api/prices/:id/expire             - Expirer prix
   PATCH /api/prices/:id/verify             - Valider prix (RA10)
   ```

### Frontend (React)

4. **Composant** (`src/components/PriceHistoryChart.jsx`)
   - Graphique Chart.js avec lignes temporelles
   - Filtres : magasin, période (30/90/180/365 jours)
   - Stats: min/max/moy/actuel par magasin
   - Gestion d'erreurs et loading states

## 🚀 Instructions de Démarrage

### 1. Installer PostgreSQL

Suivez [backend/db/README.md](../../backend/db/README.md) pour:
- Installer PostgreSQL
- Créer la base `panier_intelligent`
- Configurer `.env`

### 2. Installer les dépendances

```powershell
# Backend
cd backend
npm install  # Installe pg + uuid

# Frontend
cd ..
npm install  # Installe chart.js + react-chartjs-2
```

### 3. Exécuter les migrations

```powershell
cd backend
npm run migrate
```

Sortie attendue:
```
[Migrations] Found 1 migration file(s):
  - 001_create_price_history.sql

[Migrations] Running: 001_create_price_history.sql...
[Migrations] ✅ Success: 001_create_price_history.sql

[Migrations] All migrations completed successfully! 🎉
```

### 4. Démarrer les serveurs

```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd ..
npm run dev
```

## 🧪 Tester l'API

### Ajouter des prix de test

```powershell
# Prix #1: Lait à Metro
Invoke-RestMethod -Uri http://localhost:3001/api/prices -Method Post `
  -ContentType 'application/json' `
  -Body (ConvertTo-Json @{
    productId = "lait-2l-natrel"
    productName = "Lait 2L Natrel"
    storeId = "metro-001"
    storeName = "Metro Jean-Talon"
    prix = 5.99
    prixUnitaire = 2.995
    unite = "L"
    source = "circulaire"
    confidence = 0.95
  })

# Prix #2: Lait à IGA (moins cher)
Invoke-RestMethod -Uri http://localhost:3001/api/prices -Method Post `
  -ContentType 'application/json' `
  -Body (ConvertTo-Json @{
    productId = "lait-2l-natrel"
    productName = "Lait 2L Natrel"
    storeId = "iga-001"
    storeName = "IGA Laurier"
    prix = 4.99
    prixUnitaire = 2.495
    unite = "L"
    source = "manual"
    confidence = 1.0
  })

# Prix #3: Lait à Metro (en spécial 1 semaine plus tard)
$tomorrow = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
Invoke-RestMethod -Uri http://localhost:3001/api/prices -Method Post `
  -ContentType 'application/json' `
  -Body (ConvertTo-Json @{
    productId = "lait-2l-natrel"
    productName = "Lait 2L Natrel"
    storeId = "metro-001"
    storeName = "Metro Jean-Talon"
    prix = 4.49
    prixUnitaire = 2.245
    unite = "L"
    validFrom = $tomorrow
    source = "circulaire"
    confidence = 0.98
  })
```

### Interroger les prix

```powershell
# Historique complet
curl http://localhost:3001/api/prices/history/lait-2l-natrel

# Comparaison inter-magasins
curl http://localhost:3001/api/prices/compare/lait-2l-natrel

# Prix actuel à Metro
curl http://localhost:3001/api/prices/current/lait-2l-natrel/metro-001

# Détecter prix obsolètes (> 30 jours)
curl "http://localhost:3001/api/prices/stale?daysThreshold=30"
```

## 🎨 Utiliser le Composant Frontend

### Dans ProductItem.jsx ou Analyse.jsx

```jsx
import PriceHistoryChart from '../components/PriceHistoryChart'

// Dans votre composant
<PriceHistoryChart 
  productId="lait-2l-natrel"
  productName="Lait 2L Natrel"
/>
```

### Exemple dans une Modal

```jsx
const [showHistory, setShowHistory] = useState(false)

// Bouton pour ouvrir
<button onClick={() => setShowHistory(true)}>
  📊 Voir l'historique
</button>

// Modal
{showHistory && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Historique des Prix</h2>
        <button onClick={() => setShowHistory(false)}>✕</button>
      </div>
      <PriceHistoryChart 
        productId={product.id}
        productName={product.nom}
      />
    </div>
  </div>
)}
```

## 📈 Scénarios d'Utilisation

### 1. Suivi Prix Circulaires (BA3)

Lors du téléversement d'une circulaire OCR:

```javascript
// Dans admin.js après OCR
const ocrPrices = extractedPrices.map(p => ({
  productId: p.id,
  productName: p.nom,
  storeId: flyerStore.id,
  storeName: flyerStore.name,
  prix: p.prix,
  prixUnitaire: p.prixUnitaire,
  unite: p.unite,
  validFrom: flyerStartDate,
  validTo: flyerEndDate,
  source: 'circulaire',
  confidence: p.ocrConfidence
}))

await fetch('http://localhost:3001/api/prices/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prices: ocrPrices })
})
```

### 2. Détection Prix Obsolètes (RA9)

```javascript
// Dans useAppStore.js ou un worker
const stalePrices = await fetch(
  'http://localhost:3001/api/prices/stale?daysThreshold=30'
).then(r => r.json())

if (stalePrices.count > 0) {
  addToast(`⚠️ ${stalePrices.count} prix obsolètes détectés`, 'warning')
  // Afficher un badge dans l'UI pour demander mise à jour
}
```

### 3. Validation Admin (RA10)

```javascript
// Dans Admin.jsx après revue manuelle
const verifyPrice = async (priceId) => {
  await fetch(`http://localhost:3001/api/prices/${priceId}/verify`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ adminId: 'admin-user-id' })
  })
  addToast('Prix vérifié ✅', 'success')
}
```

## 🔍 Vérification PostgreSQL

```powershell
# Se connecter à la DB
psql -U postgres -d panier_intelligent

# Vérifier la table
SELECT COUNT(*) FROM price_history;

# Voir les derniers prix
SELECT product_name, store_name, prix, valid_from, source 
FROM price_history 
ORDER BY created_at DESC 
LIMIT 10;

# Voir les prix actuels seulement
SELECT * FROM current_prices;

# Stats tendances
SELECT * FROM price_trends;
```

## 📊 Métriques Implémentées (BA6)

- ✅ Historique complet avec provenance
- ✅ Détection prix obsolètes (RA9)
- ✅ Validation humaine (RA10)
- ✅ Comparaison inter-magasins
- ✅ Tendances min/max/avg
- ✅ Support import batch OCR
- ✅ Visualisation graphique

## 🎯 Prochaines Étapes

1. **Intégrer dans Analyse.jsx**
   - Ajouter bouton "📊 Historique" sur chaque produit
   - Afficher indicateur si prix obsolète (>30j)

2. **Webhook OCR → PriceHistory**
   - Modifier upload circulaire pour auto-insérer prix
   - Batch insert après validation admin

3. **Alertes Prix**
   - Notification quand prix baisse >10%
   - Email hebdo des meilleures aubaines

## 🐛 Dépannage

Voir [backend/db/README.md](../../backend/db/README.md) section "Dépannage"

## 📚 Documentation API Complète

Voir Swagger auto-généré (à venir) : `http://localhost:3001/api-docs`
