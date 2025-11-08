# Business Rules: Prix (Price) Handling

## Current Problem
**Inconsistency identified:** Products showing "Prix indisponible" in Liste can show a price in Analyse.

### Root Cause
- **Liste (ProductItem.jsx):** Uses `product.prix` field stored in LocalForage database
- **Analyse:** Uses `getPrixProduits()` mock API which generates random prices
- **Result:** Two different price sources = inconsistent user experience

## Data Sources for Prix

### 1. Product.prix (Database field)
- Stored in LocalForage via `db.js`
- Set manually by user via "💵 Prix" button
- Can be null (never set) or a number
- Used by: Liste, Magasin

### 2. getPrixProduits() API (Mock service)
- Returns random prices 1.5-10.0$ for all products
- Does NOT check if product.prix is set
- Used by: Analyse optimization algorithm

### 3. Weekly Prices (prices.json / weeklyPrices.js)
- External price feed (currently empty/initial)
- Normalized format: `{ name, store, price, updatedAt }`
- Used by: Suggestions, future price history

## Expected Behavior (To Fix)

### Liste Page
- If `product.prix == null`: Show "Prix indisponible"
- If `product.prix != null`: Show price in $

### Analyse Page
**Option A (Recommended):** Use stored product.prix when available
```javascript
// In Analyse.jsx, before calling optimization:
const productsWithPrices = products.map(p => ({
  ...p,
  hasStoredPrice: p.prix != null
}))

// In getPrixProduits or optimization logic:
// Prioritize product.prix over mock data
```

**Option B:** Clearly indicate mock prices
```javascript
// Show badge: "Prix estimé" vs "Prix réel"
{a.price != null ? (
  a.isEstimated 
    ? `~${a.price.toFixed(2)}$ (estimé)` 
    : `${a.price.toFixed(2)}$`
) : 'Prix indisponible'}
```

### Magasin Page
- Uses `product.prix` for total calculation
- Auto-applies combination assignments
- Consistent with Liste (both use stored prix)

## Proposed Fix Strategy

### Phase 1: Short-term (Consistency)
1. Modify `getPrixProduits()` to check product.prix first
2. Only generate mock price if product.prix == null
3. Mark prices as `isEstimated: true/false` in response

### Phase 2: Medium-term (Real Data)
1. Integrate weekly prices data feed
2. Build community OCR upload feature (in progress)
3. Deprecate mock price generator

### Phase 3: Long-term (User Trust)
1. Always show price source: "Metro", "IGA", "Communauté", "Estimé"
2. Price history per product
3. Price alerts when drops below target

## Code Changes Required

### 1. src/services/apiPrix.js
```javascript
export async function getPrixProduits(products){
  const result = {}
  for(const p of products){
    const key = String(p.nom || '').trim().toLowerCase()
    if(!key) continue
    
    const map = {}
    const STORES = ['IGA','Metro','Walmart','Maxi','Provigo']
    
    for(const store of STORES){
      // PRIORITY 1: Use stored product.prix if available
      if(p.prix != null && p.magasin === store){
        map[store] = p.prix
        continue
      }
      
      // PRIORITY 2: Check weekly prices feed
      // (future: check getBestWeeklyOffers)
      
      // PRIORITY 3: Generate mock price (fallback)
      const r = Math.random() * 8.5
      const price = 1.5 + r
      map[store] = Math.round(price * 100) / 100
    }
    result[key] = map
  }
  return result
}
```

### 2. src/pages/Analyse.jsx
Add price source tracking and display:
```javascript
// In combination card:
<span className="text-gray-600">
  {a.store || '—'} • {a.price != null 
    ? `$${a.price.toFixed(2)}${a.isStored ? '' : ' (estimé)'}` 
    : 'Prix indisponible'
  }
</span>
```

### 3. src/components/ProductItem.jsx
Keep current behavior (already correct):
```javascript
{product.prix != null 
  ? `${product.prix.toFixed?.(2) ?? product.prix} $`
  : <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
      Prix indisponible
    </span>
}
```

## Testing Checklist
- [ ] Product with prix=null in Liste shows "Prix indisponible"
- [ ] Same product in Analyse shows "Prix estimé" or no price
- [ ] Product with prix=5.99 in Liste shows 5.99$
- [ ] Same product in Analyse uses 5.99$ for optimization
- [ ] Magasin total calculation matches Liste prices
- [ ] Weekly price feed integration (when available) prioritized

## Future Enhancements
1. Real-time price comparison (scraping/API)
2. Historical price charts per product
3. Price drop notifications
4. User-submitted prices via OCR (in progress)
5. Crowd-sourced price validation
