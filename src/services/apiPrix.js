// Mock API for prices. For now returns random prices for products.
import axios from 'axios'

const STORES = ['IGA', 'Maxi', 'Metro', 'Walmart']

// Deterministic-ish pseudo-random generator from string
function seedFromString(s){
  let h = 2166136261 >>> 0
  for(let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Return prices per product per store in the shape {
//   "lait": { "IGA": 3.29, "Maxi": 2.99, ... }
// }
// PRIORITY: If product has stored prix + magasin, use that first (fixes Liste/Analyse inconsistency)
// Also returns metadata: { prices: {...}, meta: { productName: { store: { isStored: bool } } } }
export async function getPrixProduits(products){
  // simulate latency
  await new Promise(r => setTimeout(r, 200))
  const result = {}
  const meta = {} // Track price source
  
  products.forEach((p, idx) => {
    const nom = p.nom || p.id || `produit-${idx}`
    const seed = seedFromString(String(nom))
    const map = {}
    meta[nom] = {}
    
    STORES.forEach((store, i) => {
      // PRIORITY 1: Use stored product.prix if magasin matches
      if(p.prix != null && p.magasin && String(p.magasin).toLowerCase() === String(store).toLowerCase()){
        map[store] = Number(p.prix)
        meta[nom][store] = { isStored: true, source: 'manuel' }
        return
      }
      
      // PRIORITY 2: If product has prix but no magasin, apply to all stores
      if(p.prix != null && !p.magasin){
        map[store] = Number(p.prix)
        meta[nom][store] = { isStored: true, source: 'manuel' }
        return
      }
      
      // PRIORITY 3: Generate mock price (fallback for products without stored prices)
      const r = ((seed >> (i*3)) % 850) / 100.0 // 0..8.5
      const price = 1.5 + r
      map[store] = Math.round(price * 100) / 100
      meta[nom][store] = { isStored: false, source: 'estime' }
    })
    result[nom] = map
  })
  
  // Attach metadata for consumers who need it
  result.__meta = meta
  return result
}

// Backwards compatible: fetchPricesForProducts returns array of {id, nom, prices:[{magasin,prix}]}
export async function fetchPricesForProducts(products){
  const obj = await getPrixProduits(products)
  return products.map(p => ({
    id: p.id,
    nom: p.nom,
    prices: Object.entries(obj[p.nom] || {}).map(([magasin, prix]) => ({ magasin, prix }))
  }))
}
