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
export async function getPrixProduits(products){
  // simulate latency
  await new Promise(r => setTimeout(r, 200))
  const result = {}
  products.forEach((p, idx) => {
    const nom = p.nom || p.id || `produit-${idx}`
    const seed = seedFromString(String(nom))
    const map = {}
    STORES.forEach((store, i) => {
      // generate price between 1.5 and 10.0
      const r = ((seed >> (i*3)) % 850) / 100.0 // 0..8.5
      const price = 1.5 + r
      map[store] = Math.round(price * 100) / 100
    })
    result[nom] = map
  })
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
