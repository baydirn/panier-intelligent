// Suggestions de produits similaires (même catégorie, autres marques)
import { findProduct, PRODUCTS_DB, getBrandsForProduct } from '../data/productsDatabase'

export function suggestSimilarProducts(productName, max = 5){
  if(!productName) return []
  const base = findProduct(productName)
  if(!base) return []
  const list = []
  // autres marques du même produit
  const brands = getBrandsForProduct(base.key)
  for(const b of brands){
    list.push({ name: `${base.key} ${b.name}`, brand: b.name, type: 'brand' })
    if(list.length >= max) return list
  }
  // autres produits de la même catégorie
  for(const [key, p] of Object.entries(PRODUCTS_DB)){
    if(key === base.key) continue
    if(p.category === base.category){
      list.push({ name: key, type: 'category' })
      if(list.length >= max) break
    }
  }
  return list.slice(0, max)
}
